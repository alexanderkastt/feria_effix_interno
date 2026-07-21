-- ============================================================================
-- Finanzas (Bloque A) — presupuesto maestro (el PLAN anual).
-- Autor lógico: db-architect.
--
-- Este bloque SOLO crea el esquema de `categorias_presupuesto` y
-- `lineas_presupuesto`. NO inserta datos (el usuario escribe él mismo la
-- migración de datos con las 77 líneas reales, para evitar errores de
-- transcripción) y NO toca las tablas `ingresos`/`gastos` genéricas de
-- 20260701222729_v2_modulos.sql (siguen usándose en otro lado).
--
-- Depende de (creado en 20260710220000_finanzas_permisos.sql, NO se toca acá):
--   - enum nivel_sensibilidad
--   - función puede_ver_nivel_financiero(nivel_sensibilidad, uuid, text, uuid)
--   - helpers es_admin_global(), es_gestor_area(), es_finanzas_operativo(),
--     puede_ver_area(uuid) (este último de init.sql)
-- RLS ACTIVADO en ambas tablas desde su creación (regla no negociable).
-- ============================================================================

-- ---------- Tipos ------------------------------------------------------------
create type tipo_categoria_presupuesto as enum ('ingreso', 'egreso');

-- ============================================================================
-- categorias_presupuesto
-- ============================================================================
-- Catálogo ABIERTO, no un enum cerrado: el usuario pidió explícitamente poder
-- crear categorías y subcategorías nuevas desde la interfaz cuando haga falta
-- (no solo las ~12 iniciales del Excel). `nombre` es texto libre a propósito.
--
-- Jerarquía de un solo nivel: una categoría raíz (parent_id null) puede tener
-- subcategorías (parent_id = id de la raíz). El trigger de abajo impide crear
-- sub-subcategorías (parent de una categoría que a su vez ya tiene parent) y
-- exige que una subcategoría comparta el mismo `tipo` (ingreso/egreso) que su
-- categoría padre, para que la jerarquía no mezcle ingresos con egresos.
--
-- area_id es NULLABLE a propósito: varias categorías reales del presupuesto
-- (Plaza mayor, Impuesto, Fijos, Variables, Pre evento, Evento, Audiovisual)
-- no corresponden 1:1 a ninguna de las 12 áreas operativas — se dejan en null.
-- Solo se enlaza area_id cuando la categoría SÍ coincide claramente con un
-- área existente (ej. "Marketing" → marketing, "Logística" → logistica).
create table categorias_presupuesto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  parent_id uuid references categorias_presupuesto (id) on delete restrict,
  tipo tipo_categoria_presupuesto not null,
  area_id uuid references areas (id),
  creado_en timestamptz not null default now()
);

comment on table categorias_presupuesto is
  'Catálogo ABIERTO (no enum cerrado) de categorías/subcategorías del presupuesto '
  'maestro de Finanzas. Jerarquía de un solo nivel (parent_id nullable, validada '
  'por trigger). area_id nullable: solo se enlaza cuando la categoría coincide '
  'con un área operativa existente. INSERT/UPDATE/DELETE reservados a '
  'es_admin_global() por ahora — el módulo aún no está expuesto al resto del '
  'equipo (área finanzas con listo:false). El usuario puede crear categorías y '
  'subcategorías nuevas desde la interfaz en cualquier momento, no solo las '
  'iniciales del Excel.';
comment on column categorias_presupuesto.parent_id is
  'Null = categoría raíz. Si no es null, referencia una categoría raíz (una '
  'subcategoría no puede a su vez ser padre de otra: jerarquía de un solo '
  'nivel, validada en categorias_presupuesto_valida_jerarquia()).';
comment on column categorias_presupuesto.area_id is
  'Nullable. Solo se completa cuando la categoría coincide 1:1 con un área '
  'operativa existente (ej. Marketing, Logística, Diseño, Ponentes). Muchas '
  'categorías del presupuesto real (Plaza mayor, Impuesto, Fijos, Variables, '
  'Pre evento, Evento, Audiovisual) no tienen área correspondiente y quedan en null.';

create index categorias_presupuesto_parent_idx on categorias_presupuesto (parent_id);
create index categorias_presupuesto_area_idx on categorias_presupuesto (area_id);

-- Valida: (a) una categoría no puede ser su propio padre, (b) jerarquía de un
-- solo nivel (el padre no puede a su vez tener padre), (c) el tipo de la
-- subcategoría coincide con el de su padre.
create or replace function categorias_presupuesto_valida_jerarquia()
returns trigger
language plpgsql
as $$
declare
  v_parent_tipo tipo_categoria_presupuesto;
  v_parent_parent uuid;
begin
  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'categorias_presupuesto: una categoría no puede ser su propio padre';
    end if;

    select tipo, parent_id into v_parent_tipo, v_parent_parent
      from categorias_presupuesto where id = new.parent_id;

    if not found then
      raise exception 'categorias_presupuesto: parent_id % no existe', new.parent_id;
    end if;

    if v_parent_parent is not null then
      raise exception
        'categorias_presupuesto: jerarquía de un solo nivel — % ya es una subcategoría, no puede tener sub-subcategorías',
        new.parent_id;
    end if;

    if v_parent_tipo <> new.tipo then
      raise exception
        'categorias_presupuesto: el tipo (ingreso/egreso) de la subcategoría debe coincidir con el de su categoría padre (%)',
        v_parent_tipo;
    end if;
  end if;

  return new;
end;
$$;

create trigger categorias_presupuesto_valida_jerarquia_trg
  before insert or update on categorias_presupuesto
  for each row execute function categorias_presupuesto_valida_jerarquia();

alter table categorias_presupuesto enable row level security;

-- SELECT: no es un dato tan sensible como los montos (solo nombres/jerarquía),
-- pero el módulo sigue cerrado al resto del equipo por ahora. Mismo criterio
-- que 'resumen' en puede_ver_nivel_financiero: admin/finanzas_operativo ven
-- todo, gestor_area solo categorías de su propia área o sin área asignada
-- (las categorías transversales tipo "Fijos"/"Impuesto" no deberían ocultarse
-- a un gestor_area que sí puede ver líneas de presupuesto nivel 'resumen').
create policy categorias_presupuesto_select on categorias_presupuesto
  for select to authenticated using (
    es_admin_global()
    or es_finanzas_operativo()
    or (es_gestor_area() and (area_id is null or puede_ver_area(area_id)))
  );

create policy categorias_presupuesto_insert on categorias_presupuesto
  for insert to authenticated with check (es_admin_global());
create policy categorias_presupuesto_update on categorias_presupuesto
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy categorias_presupuesto_delete on categorias_presupuesto
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on categorias_presupuesto to authenticated;

-- ============================================================================
-- lineas_presupuesto
-- ============================================================================
-- area_id está DESNORMALIZADA acá (copiada de categorias_presupuesto.area_id)
-- en vez de resolverse con un subquery dentro de la policy de RLS. Decisión:
-- una columna simple es más performante para RLS (Postgres puede usarla en un
-- índice / filtro directo en vez de re-ejecutar un subquery correlacionado por
-- fila en cada SELECT) y evita duplicar la lógica de "de dónde sale el
-- area_id" en cada policy futura que necesite esta tabla. La consistencia se
-- garantiza con un trigger (lineas_presupuesto_sync_area, abajo) que la
-- recalcula SIEMPRE desde categoria_id en cada INSERT/UPDATE — no es editable
-- "a mano" de forma independiente, así que no hay riesgo de que quede
-- desincronizada ni de que alguien la use para escalar acceso.
create table lineas_presupuesto (
  id uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references categorias_presupuesto (id) on delete restrict,
  area_id uuid references areas (id),
  concepto text not null,
  valor_estimado_actual numeric not null default 0,
  valor_real_anio_anterior numeric,
  cantidad numeric,
  edicion text not null,
  observaciones text,
  nivel_sensibilidad nivel_sensibilidad not null default 'resumen',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table lineas_presupuesto is
  'Líneas del presupuesto MAESTRO (el plan anual), no el libro contable real '
  '(eso es Bloque B: movimientos_ingresos/movimientos_egresos, todavía no '
  'existe). valor_estimado_actual = presupuesto de la edición que se planea. '
  'valor_real_anio_anterior = referencia histórica opcional ("Costo real" del '
  'año anterior). INSERT/UPDATE/DELETE reservados a es_admin_global() por '
  'ahora. SELECT gobernado por puede_ver_nivel_financiero() según '
  'nivel_sensibilidad de cada línea.';
comment on column lineas_presupuesto.area_id is
  'Desnormalizada desde categorias_presupuesto.area_id vía trigger '
  'lineas_presupuesto_sync_area (ver definición de la función): se recalcula '
  'en cada INSERT/UPDATE a partir de categoria_id, nunca se setea a mano. '
  'Existe para que la policy de SELECT no necesite un subquery correlacionado.';
comment on column lineas_presupuesto.valor_real_anio_anterior is
  'Referencia histórica ("Costo real" del año anterior). Nullable: no todas '
  'las líneas tienen equivalente en la edición anterior.';
comment on column lineas_presupuesto.cantidad is
  'Nullable. Para conceptos cotizados por unidad (ej. "cantidad de escarapelas").';

create index lineas_presupuesto_categoria_idx on lineas_presupuesto (categoria_id);
create index lineas_presupuesto_edicion_idx on lineas_presupuesto (edicion);
create index lineas_presupuesto_area_idx on lineas_presupuesto (area_id);

-- Mantiene area_id sincronizada con categorias_presupuesto.area_id en cada
-- INSERT/UPDATE (sin importar si categoria_id cambió o no), para que nunca
-- pueda quedar desincronizada ni seteada manualmente a un valor distinto.
create or replace function lineas_presupuesto_sync_area()
returns trigger
language plpgsql
as $$
begin
  select area_id into new.area_id
    from categorias_presupuesto
    where id = new.categoria_id;

  if not found then
    raise exception 'lineas_presupuesto: categoria_id % no existe', new.categoria_id;
  end if;

  return new;
end;
$$;

create trigger lineas_presupuesto_sync_area_trg
  before insert or update on lineas_presupuesto
  for each row execute function lineas_presupuesto_sync_area();

-- Reusa el trigger genérico touch_actualizado_en() ya definido en init.sql —
-- mismo criterio de nomenclatura (creado_en/actualizado_en) que el resto del
-- esquema, sin duplicar función.
create trigger lineas_presupuesto_touch
  before update on lineas_presupuesto
  for each row execute function touch_actualizado_en();

alter table lineas_presupuesto enable row level security;

create policy lineas_presupuesto_select on lineas_presupuesto
  for select to authenticated using (
    puede_ver_nivel_financiero(nivel_sensibilidad, area_id, categoria_id::text, id)
  );

create policy lineas_presupuesto_insert on lineas_presupuesto
  for insert to authenticated with check (es_admin_global());
create policy lineas_presupuesto_update on lineas_presupuesto
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy lineas_presupuesto_delete on lineas_presupuesto
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on lineas_presupuesto to authenticated;
