-- ============================================================================
-- Finanzas (Bloque D) — calculadora de escenarios de comisiones comerciales
-- de venta de stands.
-- Autor lógico: db-architect.
--
-- Modelo de 3 escenarios reales (no hipotéticos): "Escenario Positivo",
-- "Escenario Conservador" (renovar el 50% de lo que falta + resto venta
-- nueva), "Escenario Pesimista" (recuperar solo el 25% de los del 2025).
-- Cada escenario tiene hasta 3 conceptos (comision_items): falta_por_vender
-- (referencia, sin comisión), falta_por_renovar (tasa 2%), ventas_nuevas
-- (tasa 5%).
--
-- Se investigó explícitamente si se podía automatizar el link con la tabla
-- `stands` (comparar "renovación edición a edición"): NO es posible hoy.
-- `stands` no tiene columna `edicion` (es data de una sola edición) y la suma
-- actual de stands en estado 'disponible' no coincide con la cifra del Excel
-- (cortes de fecha distintos). Por lo tanto esta migración NO toca `stands`
-- ni construye ningún cálculo derivado de esa tabla: los valores de
-- comision_items son manuales/editables, cargados por la persona usuaria.
--
-- Depende de (creado en 20260710220000_finanzas_permisos.sql, NO se toca acá):
--   - helpers es_admin_global(), es_finanzas_operativo()
--
-- Nivel de riesgo: BAJO, mismo criterio que Bloque E/venue. No hay NITs ni
-- nómina acá, y no se usa nivel_sensibilidad por fila. SELECT para
-- es_admin_global() o es_finanzas_operativo(); INSERT/UPDATE/DELETE solo
-- es_admin_global().
--
-- RLS ACTIVADO en las dos tablas desde su creación (regla no negociable).
--
-- No se insertan datos en esta migración: los 3 escenarios reales con sus
-- valores exactos del Excel los carga el usuario después.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum concepto_comision
-- ----------------------------------------------------------------------------
create type concepto_comision as enum (
  'falta_por_vender',
  'falta_por_renovar',
  'ventas_nuevas'
);
comment on type concepto_comision is
  'Concepto de un ítem dentro de un escenario de comisión de venta de stands. '
  '''falta_por_vender'' = inventario total de stands aún sin vender (mismo '
  'valor en los 3 escenarios, sin tasa de comisión, solo referencia). '
  '''falta_por_renovar'' = valor que se asume se recupera de clientes de la '
  'edición anterior (tasa 2%). ''ventas_nuevas'' = valor que se asume se '
  'vende a clientes nuevos (tasa 5%).';

-- ============================================================================
-- escenarios_comision
-- ============================================================================
create table escenarios_comision (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  edicion text not null,
  creado_en timestamptz not null default now()
);

comment on table escenarios_comision is
  'Catálogo de escenarios de la calculadora de comisiones comerciales de '
  'venta de stands (ej. "Escenario Positivo", "Escenario Conservador", '
  '"Escenario Pesimista"). Los conceptos que componen cada escenario y sus '
  'valores/comisiones viven en comision_items. INSERT/UPDATE/DELETE '
  'reservados a es_admin_global(); SELECT también permitido a '
  'es_finanzas_operativo().';
comment on column escenarios_comision.nombre is
  'Nombre corto del escenario (ej. "Escenario Positivo").';
comment on column escenarios_comision.descripcion is
  'Nullable: descripción larga del supuesto del escenario, cuando la tiene '
  '(ej. Conservador: "Que se renueve el 50% de lo que falta y el resto sea '
  'venta nueva"; Pesimista: "Que se recupere solo el 25% de los del 2025"). '
  'El Positivo, en los datos reales del Excel, no trae descripción larga.';
comment on column escenarios_comision.edicion is
  'Edición de la feria a la que corresponde el escenario (ej. ''2026'').';

create index escenarios_comision_edicion_idx on escenarios_comision (edicion);

alter table escenarios_comision enable row level security;

create policy escenarios_comision_select on escenarios_comision
  for select to authenticated using (es_admin_global() or es_finanzas_operativo());
create policy escenarios_comision_insert on escenarios_comision
  for insert to authenticated with check (es_admin_global());
create policy escenarios_comision_update on escenarios_comision
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy escenarios_comision_delete on escenarios_comision
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on escenarios_comision to authenticated;

-- ============================================================================
-- comision_items
-- ============================================================================
create table comision_items (
  id uuid primary key default gen_random_uuid(),
  escenario_id uuid not null references escenarios_comision (id) on delete cascade,
  concepto concepto_comision not null,
  valor_base numeric(14, 2) not null,
  tasa_comision numeric(5, 4),
  valor_comision numeric(14, 2) generated always as (valor_base * tasa_comision) stored,
  creado_en timestamptz not null default now()
);

comment on table comision_items is
  'Ítems (conceptos) de cada escenario_comision. valor_comision es una '
  'COLUMNA GENERADA (generated always as valor_base * tasa_comision stored): '
  'es literalmente imposible que quede hardcodeada o desincronizada del '
  'valor_base/tasa_comision — nunca se calcula en la aplicación ni se '
  'inserta a mano. INSERT/UPDATE/DELETE reservados a es_admin_global(); '
  'SELECT también permitido a es_finanzas_operativo().';
comment on column comision_items.tasa_comision is
  'Tasa de comisión en formato decimal (ej. 0.0200 = 2%, 0.0500 = 5%). '
  'Nullable: null para concepto = ''falta_por_vender'', que es solo '
  'inventario de referencia sin comisión asociada. Cuando es null, Postgres '
  'computa valor_comision como null automáticamente (comportamiento '
  'correcto, no requiere lógica adicional).';
comment on column comision_items.valor_comision is
  'GENERATED ALWAYS AS (valor_base * tasa_comision) STORED. No aceptar '
  'nunca un INSERT/UPDATE que intente escribir esta columna directamente '
  '(Postgres lo rechaza por ser generada) — así se garantiza que jamás '
  'quede un valor de comisión desincronizado de su base y su tasa.';

create index comision_items_escenario_idx on comision_items (escenario_id);
create index comision_items_concepto_idx on comision_items (concepto);

alter table comision_items enable row level security;

create policy comision_items_select on comision_items
  for select to authenticated using (es_admin_global() or es_finanzas_operativo());
create policy comision_items_insert on comision_items
  for insert to authenticated with check (es_admin_global());
create policy comision_items_update on comision_items
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy comision_items_delete on comision_items
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on comision_items to authenticated;
