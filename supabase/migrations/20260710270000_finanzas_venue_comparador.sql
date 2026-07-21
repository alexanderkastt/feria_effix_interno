-- ============================================================================
-- Finanzas (Bloque E) — comparador de decisiones de venue.
-- Autor lógico: db-architect.
--
-- Análisis de costos de espacio (Plaza Mayor) para decidir, edición a
-- edición, si conviene arrendar solo pabellones específicos o todo el
-- recinto. NO es el presupuesto maestro (Bloque A) ni el libro de
-- movimientos reales (Bloque B): es un módulo de comparación de escenarios
-- históricos/hipotéticos de venue, independiente.
--
-- Depende de (creado en 20260710220000_finanzas_permisos.sql, NO se toca acá):
--   - helpers es_admin_global(), es_finanzas_operativo()
-- Depende de (creado en 20260701211633_init.sql, NO se toca acá):
--   - función touch_actualizado_en() (no se usa en este bloque: ninguna de
--     estas tres tablas tiene actualizado_en/UPDATE por trigger, tal como se
--     definió con el usuario)
--
-- Nivel de riesgo: BAJO. No hay NITs, nómina, ni nivel_sensibilidad por fila
-- (a diferencia de categorias_presupuesto/lineas_presupuesto). Se usa el
-- mismo criterio del nivel "resumen": SELECT para es_admin_global() o
-- es_finanzas_operativo(); INSERT/UPDATE/DELETE solo es_admin_global(). El
-- módulo de Finanzas sigue sin exponerse al resto del equipo (área
-- `finanzas` con listo:false en el sistema de módulos).
--
-- RLS ACTIVADO en las tres tablas desde su creación (regla no negociable).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum unidad_tarifa_venue
-- ----------------------------------------------------------------------------
-- El Excel original de Plaza Mayor usa unidades abreviadas "CD" y "EA" cuyo
-- significado exacto no se puede confirmar sin el contrato (no disponible al
-- momento de esta migración). Decisión explícita del usuario: NO adivinar ni
-- traducir ("Convención Día" o cualquier otra interpretación) — modelarlo tal
-- cual aparece en la fuente, como dato configurable que la persona que carga
-- un espacio nuevo elige manualmente desde la interfaz (el sistema nunca la
-- infiere).
--
-- Es un enum real de Postgres (no texto libre ni CHECK), con exactamente los
-- 3 valores pedidos: 'CD', 'EA', 'otro'. Puede ampliarse más adelante con
-- `alter type unidad_tarifa_venue add value if not exists '...'` — este es el
-- comportamiento estándar de un enum de Postgres, no requiere ninguna
-- migración de datos: los valores ya guardados no se ven afectados por
-- agregar valores nuevos al tipo.
create type unidad_tarifa_venue as enum ('CD', 'EA', 'otro');
comment on type unidad_tarifa_venue is
  'Unidad de la tarifa de un espacio de venue, TAL COMO aparece en el Excel '
  'original de Plaza Mayor (abreviaturas "CD"/"EA", significado exacto no '
  'confirmado sin el contrato). No traducir ni inferir: quien crea un espacio '
  'nuevo la elige manualmente desde la interfaz. Ampliable después con '
  '`alter type unidad_tarifa_venue add value if not exists ''nuevo_valor''` '
  'sin romper los datos ya migrados.';

-- ============================================================================
-- espacios_venue
-- ============================================================================
-- Catálogo ABIERTO (no enum cerrado): los 9 espacios reales de Plaza Mayor
-- (Pabellón Verde/Azul/Blanco/Amarillo/Rojo, Gran Salón, Terraza Exposiciones,
-- Salón de Conferencias A+B, Salón de Conferencias C+D) son los datos que
-- vienen del Excel, pero deben poder agregarse espacios nuevos desde la
-- interfaz para futuras ediciones sin tocar el esquema.
create table espacios_venue (
  id uuid primary key default gen_random_uuid(),
  nombre_espacio text not null,
  tarifa_unidad numeric(14, 2),
  unidad_tarifa unidad_tarifa_venue not null default 'otro',
  edicion text not null,
  creado_en timestamptz not null default now()
);

comment on table espacios_venue is
  'Catálogo ABIERTO de espacios arrendables de Plaza Mayor (pabellones, '
  'salones, terraza) con su tarifa unitaria vigente para una edición. No es '
  'un enum cerrado: se pueden agregar espacios nuevos desde la interfaz. '
  'INSERT/UPDATE/DELETE reservados a es_admin_global(); SELECT también '
  'permitido a es_finanzas_operativo() (dato de bajo riesgo, no tiene '
  'nivel_sensibilidad por fila).';
comment on column espacios_venue.tarifa_unidad is
  'Valor monetario de la tarifa por unidad (ej. 17133000). Nullable: un '
  'espacio puede crearse antes de tener tarifa confirmada.';
comment on column espacios_venue.unidad_tarifa is
  'Ver comentario del tipo unidad_tarifa_venue. Se elige manualmente al crear '
  'el espacio, nunca se infiere automáticamente.';
comment on column espacios_venue.edicion is
  'Edición de la feria a la que corresponde esta tarifa (ej. ''2026''). Un '
  'mismo nombre_espacio puede repetirse en distintas ediciones con tarifas '
  'distintas: no hay unicidad forzada sobre (nombre_espacio, edicion) porque '
  'el Excel origen no garantiza esa invariante y el usuario no la pidió.';

create index espacios_venue_edicion_idx on espacios_venue (edicion);

alter table espacios_venue enable row level security;

create policy espacios_venue_select on espacios_venue
  for select to authenticated using (es_admin_global() or es_finanzas_operativo());
create policy espacios_venue_insert on espacios_venue
  for insert to authenticated with check (es_admin_global());
create policy espacios_venue_update on espacios_venue
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy espacios_venue_delete on espacios_venue
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on espacios_venue to authenticated;

-- ============================================================================
-- escenarios_venue
-- ============================================================================
-- Catálogo ABIERTO de escenarios comparativos (texto libre en
-- nombre_escenario): "Espacio 2024", "Mismo espacio 2024", "Pabellones
-- únicamente", "Todo Plaza Mayor", "Costeo Plaza Mayor 2026", etc. Cada
-- escenario agrupa uno o más espacios vía escenario_venue_espacios.
create table escenarios_venue (
  id uuid primary key default gen_random_uuid(),
  nombre_escenario text not null,
  edicion text not null,
  total_bruto numeric(14, 2),
  iva numeric(14, 2),
  total_neto numeric(14, 2),
  incremento_ipc_estimado numeric(14, 2),
  creado_en timestamptz not null default now()
);

comment on table escenarios_venue is
  'Catálogo ABIERTO de escenarios de decisión de venue (ej. "Todo Plaza '
  'Mayor" vs "Pabellones únicamente"), cada uno con sus totales agregados. '
  'Los espacios que componen cada escenario y sus subtotales viven en '
  'escenario_venue_espacios. INSERT/UPDATE/DELETE reservados a '
  'es_admin_global(); SELECT también permitido a es_finanzas_operativo().';
comment on column escenarios_venue.incremento_ipc_estimado is
  'Nullable: estimación de incremento por IPC aplicada al comparar contra un '
  'año anterior. No todos los escenarios lo tienen (ej. escenarios puramente '
  'históricos ya cerrados).';

create index escenarios_venue_edicion_idx on escenarios_venue (edicion);

alter table escenarios_venue enable row level security;

create policy escenarios_venue_select on escenarios_venue
  for select to authenticated using (es_admin_global() or es_finanzas_operativo());
create policy escenarios_venue_insert on escenarios_venue
  for insert to authenticated with check (es_admin_global());
create policy escenarios_venue_update on escenarios_venue
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy escenarios_venue_delete on escenarios_venue
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on escenarios_venue to authenticated;

-- ============================================================================
-- escenario_venue_espacios (tabla intermedia)
-- ============================================================================
-- Un escenario puede incluir varios espacios, cada uno con su propia cantidad
-- de unidades (fraccionaria, ej. "1,50" vista en el Excel) y subtotal.
create table escenario_venue_espacios (
  id uuid primary key default gen_random_uuid(),
  escenario_id uuid not null references escenarios_venue (id) on delete cascade,
  espacio_id uuid not null references espacios_venue (id),
  unidades numeric(10, 2) not null,
  subtotal numeric(14, 2) not null,
  creado_en timestamptz not null default now()
);

comment on table escenario_venue_espacios is
  'Tabla intermedia: qué espacios (y en qué cantidad de unidades/subtotal) '
  'componen cada escenario_venue. on delete cascade desde escenarios_venue '
  '(si se borra el escenario, se borran sus líneas); espacio_id sin cascade '
  '(no se debería poder borrar un espacio_venue que está referenciado en un '
  'escenario existente — queda con la restricción por defecto de Postgres). '
  'INSERT/UPDATE/DELETE reservados a es_admin_global(); SELECT también '
  'permitido a es_finanzas_operativo().';
comment on column escenario_venue_espacios.unidades is
  'Cantidad de unidades de tarifa contratadas para este espacio dentro del '
  'escenario. Puede ser fraccionaria (ej. 1.50), tal como aparece en el Excel.';

create index escenario_venue_espacios_escenario_idx
  on escenario_venue_espacios (escenario_id);
create index escenario_venue_espacios_espacio_idx
  on escenario_venue_espacios (espacio_id);

alter table escenario_venue_espacios enable row level security;

create policy escenario_venue_espacios_select on escenario_venue_espacios
  for select to authenticated using (es_admin_global() or es_finanzas_operativo());
create policy escenario_venue_espacios_insert on escenario_venue_espacios
  for insert to authenticated with check (es_admin_global());
create policy escenario_venue_espacios_update on escenario_venue_espacios
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy escenario_venue_espacios_delete on escenario_venue_espacios
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on escenario_venue_espacios to authenticated;
