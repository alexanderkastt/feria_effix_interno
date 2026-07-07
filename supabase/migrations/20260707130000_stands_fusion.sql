-- ============================================================================
-- Feria Effix 2026 — Soporte para fusionar stands físicos vendidos como una
-- sola unidad comercial (ej. AM03 + AM04 comprados juntos por el mismo
-- cliente) y para permitir alta manual de stands nuevos desde el panel.
-- Autor lógico: db-architect
--
-- Modelo elegido: un stand "principal" concentra los datos comerciales reales
-- de la venta combinada; los stands "secundarios" solo apuntan a él vía
-- `stand_principal_id`. No se crea una tabla de grupos separada: alcanza con
-- esta columna autorreferenciada porque una fusión no necesita metadata
-- propia (fecha/motivo ya quedan en el stand principal).
--
-- REGLA DURA: no se toca ninguna columna existente de `stands`. Solo se
-- agrega `stand_principal_id`, nullable, sin afectar nada de lo ya migrado
-- en 20260701221332_stands_patrocinios.sql ni 20260701235000_stands_reales.sql.
-- ============================================================================

alter table stands
  add column if not exists stand_principal_id uuid references stands (id) on delete set null;

comment on column stands.stand_principal_id is
  'Si no es null, este stand fue fusionado como secundario dentro de la venta '
  'de otro stand (el "principal"). El principal concentra los datos '
  'comerciales reales (cliente, precio, pagos); el secundario deja de '
  'venderse por separado. Una fusión se deshace poniendo esta columna en '
  'null otra vez. No se permiten cadenas: un stand con hijos fusionados no '
  'puede a la vez ser secundario de otro (se valida en la aplicación, no acá, '
  'para poder dar un mensaje de error claro en el panel).';

create index if not exists stands_stand_principal_id_idx on stands (stand_principal_id);

-- ============================================================================
-- Nota de diseño: no se agrega constraint CHECK para evitar auto-referencia
-- (stand_principal_id = id) ni para evitar cadenas de fusión (A -> B -> C):
-- ambas reglas se validan en la capa de aplicación (server action
-- `fusionarStands`) porque ahí se puede dar un mensaje de error entendible;
-- un CHECK/trigger de SQL para "no cadenas" requeriría una consulta
-- recursiva en cada insert/update y no aporta más seguridad real dado que
-- la única vía de escritura es esa server action.
-- ============================================================================
