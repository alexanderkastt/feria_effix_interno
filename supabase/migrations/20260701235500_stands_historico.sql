-- ============================================================================
-- Feria Effix 2026 — Archivo histórico de ediciones anteriores del control de
-- stands (Excel "CONTROL STANDS FERIA EFFIX 2026.xlsx", pestañas "STANDSv1",
-- "Copia de STANDS", "Copia de STANDS 2025 V.2" y "Hoja 13").
-- Autor lógico: db-architect
--
-- Estas 4 pestañas NO son datos activos de la edición 2026 (esa es "STANDS
-- 2026", ya migrada a la tabla `stands` en 20260701221332_stands_patrocinios.sql
-- y 20260701235000_stands_reales.sql). Son borradores / control de ediciones
-- pasadas que se preservan como referencia histórica, sin normalizar columna
-- por columna (cada hoja trae nombres y casing distintos entre sí y respecto
-- al schema real 2026). Se modela UNA sola tabla genérica con las columnas
-- más comunes/reconocibles como texto libre + `datos_completos` jsonb como
-- respaldo íntegro de la fila cruda, para garantizar cero pérdida de datos.
--
-- Tabla de solo archivo/consulta: no transaccional, no referenciada desde
-- ninguna otra tabla del esquema.
--
-- RLS ACTIVADO desde su creación (regla no negociable), mismo patrón de área
-- 'stands' que el resto de las tablas de este dominio.
-- ============================================================================

create table stands_historico_ediciones (
  id uuid primary key default gen_random_uuid(),
  -- Año o etiqueta de la edición ('2024', '2025', 'sin_clasificar'...). Texto
  -- libre a propósito: la clasificación exacta se hace al momento de migrar
  -- los datos, no acá.
  edicion text,
  -- Nombre literal de la pestaña de origen en el Excel (ej. 'STANDSv1',
  -- 'Copia de STANDS', 'Copia de STANDS 2025 V.2', 'Hoja 13').
  hoja_origen text not null,
  -- Texto libre a propósito: NO reutiliza el enum `stand_pabellon` (2026).
  -- Los valores históricos vienen con casing/nombres inconsistentes
  -- (ej. "hall verde" en minúscula, "ROJO AFUERA" que no es una de las 10
  -- zonas actuales) y no se quiere que un insert falle por un valor fuera
  -- del enum.
  pabellon text,
  codigo text,
  medida text,
  valor_stand numeric(14, 2),
  nombre_comercial text,
  nombre_fiscal text,
  nombre_persona_encargado text,
  numero_contacto text,
  id_effi text,
  ciudad text,
  categoria text,
  asesor text,
  estado_reserva text,
  -- Respaldo completo de la fila cruda (todas las columnas originales como
  -- pares clave/valor), incluyendo columnas que no se mapearon arriba (ej.
  -- TOTAL, VR 1ER ABONO/VR ABONOS, VALOR RESTANTE, checklist de columnas
  -- booleanas variable por hoja). Garantiza cero pérdida de datos.
  datos_completos jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

comment on table stands_historico_ediciones is
  'Archivo histórico de ediciones anteriores del control de stands (hojas '
  '"STANDSv1", "Copia de STANDS", "Copia de STANDS 2025 V.2" y "Hoja 13" del '
  'Excel "CONTROL STANDS FERIA EFFIX 2026.xlsx"). Tabla de solo archivo/consulta, '
  'no transaccional, no referenciada desde otras tablas. Cada hoja de origen '
  'tenía columnas ligeramente distintas entre sí y respecto al schema real '
  '2026; se modela con columnas de texto libre para los campos más comunes '
  'más `datos_completos` (jsonb) como respaldo íntegro de la fila cruda.';
comment on column stands_historico_ediciones.edicion is
  'Año o etiqueta de la edición (''2024'', ''2025'', ''sin_clasificar''...). '
  'Texto libre sin enum: la clasificación exacta se hace al migrar los datos.';
comment on column stands_historico_ediciones.pabellon is
  'Texto libre. NO reutiliza el enum stand_pabellon (2026): los valores '
  'históricos traen casing/nombres inconsistentes que no encajan en las 10 '
  'zonas actuales.';
comment on column stands_historico_ediciones.datos_completos is
  'Respaldo completo de la fila cruda de origen (todas las columnas '
  'originales como pares clave/valor). Garantiza cero pérdida de datos aun de '
  'columnas no mapeadas explícitamente arriba.';

create index stands_historico_ediciones_hoja_origen_idx
  on stands_historico_ediciones (hoja_origen);
create index stands_historico_ediciones_edicion_idx
  on stands_historico_ediciones (edicion);

-- ============================================================================
-- RLS — mismo patrón de área 'stands' que 20260701221332_stands_patrocinios.sql
-- y 20260701235000_stands_reales.sql.
-- ============================================================================
alter table stands_historico_ediciones enable row level security;

create policy stands_historico_ediciones_select on stands_historico_ediciones
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy stands_historico_ediciones_write on stands_historico_ediciones
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- ---------- Grants ------------------------------------------------------------
grant select, insert, update, delete on stands_historico_ediciones to authenticated;
