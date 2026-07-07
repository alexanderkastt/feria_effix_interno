-- ============================================================================
-- Feria Effix 2026 — Stands y Patrocinios (cierre de Fase 2)
-- Autor lógico: db-architect
-- ============================================================================

-- ---------- Enums ----------------------------------------------------------
create type estado_stand as enum ('disponible', 'bloqueado_temporal', 'reservado', 'vendido');
create type tier_patrocinio as enum ('platino', 'diamante', 'oro', 'bronce');
create type estado_pago as enum ('pendiente', 'parcial', 'pagado');

-- ---------- Tablas (sin FK cruzada inline; se agregan luego) ----------------
create table stands (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text,
  tamano text,
  precio numeric(12, 2) not null default 0,
  estado estado_stand not null default 'disponible',
  bloqueado_hasta timestamptz,
  cliente_nombre text,
  cliente_email text,
  cliente_telefono text,
  patrocinador_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index stands_estado_idx on stands (estado);

create table patrocinios (
  id uuid primary key default gen_random_uuid(),
  empresa text not null,
  tier tier_patrocinio,
  monto numeric(12, 2) not null default 0,
  estado_pago estado_pago not null default 'pendiente',
  entregables_pendientes text,
  stand_id uuid,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- FKs cruzadas (ambas nullable, on delete set null)
alter table stands
  add constraint stands_patrocinador_fk
  foreign key (patrocinador_id) references patrocinios (id) on delete set null;
alter table patrocinios
  add constraint patrocinios_stand_fk
  foreign key (stand_id) references stands (id) on delete set null;

-- Mantener actualizado_en (reutiliza la función de la migración inicial)
create trigger stands_touch before update on stands
  for each row execute function touch_actualizado_en();
create trigger patrocinios_touch before update on patrocinios
  for each row execute function touch_actualizado_en();

-- ---------- Vista pública (solo columnas seguras, sin PII de clientes) ------
create view stands_publico as
  select id, codigo, nombre, tamano, precio, estado, bloqueado_hasta
  from stands;

-- ---------- Liberación de bloqueos temporales vencidos (30 min) -------------
-- Se llama de forma perezosa al cargar el mapa (no depende de cron).
create or replace function liberar_stands_vencidos()
returns void
language sql security definer set search_path = public
as $$
  update stands
  set estado = 'disponible', bloqueado_hasta = null,
      cliente_nombre = null, cliente_email = null, cliente_telefono = null
  where estado = 'bloqueado_temporal' and bloqueado_hasta < now();
$$;

-- ============================================================================
-- RLS
-- ============================================================================
alter table stands enable row level security;
alter table patrocinios enable row level security;

-- stands (tabla base): solo equipo con acceso al área 'stands'.
-- El público NO toca la tabla base: lee por la vista `stands_publico` y
-- reserva vía server action con service_role (validado del lado del servidor).
create policy stands_select on stands
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy stands_write on stands
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- patrocinios: lo ven quienes pueden ver patrocinios O stands (Aleja vincula
-- stands con patrocinadores). Editar: solo quien puede editar patrocinios.
create policy patrocinios_select on patrocinios
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'patrocinios'))
    or puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy patrocinios_write on patrocinios
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'patrocinios'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'patrocinios'))
  );

-- ---------- Grants ----------------------------------------------------------
grant select on stands_publico to anon, authenticated;
grant select, insert, update, delete on stands, patrocinios to authenticated;
-- El anónimo NO tiene grant sobre la tabla base stands (usa la vista + action).
