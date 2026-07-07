-- ============================================================================
-- Feria Effix 2026 — Esquema inicial (Fase 0)
-- Autor lógico: db-architect
-- RLS ACTIVADO en TODAS las tablas desde su creación (regla no negociable).
-- ============================================================================

-- ---------- Tipos / enums --------------------------------------------------
create type rol_base as enum ('directivo', 'administrativo', 'gestor_area', 'colaborador');

create type area_nombre as enum (
  'ponentes', 'stands', 'patrocinios', 'logistica', 'diseno', 'video',
  'produccion', 'finanzas', 'estrategia', 'marketing', 'alianzas', 'comunidades'
);

create type nivel_acceso as enum ('lectura', 'edicion', 'admin');
create type estado_tarea as enum ('pendiente', 'en_proceso', 'bloqueado', 'hecho');
create type prioridad as enum ('baja', 'media', 'alta');

create type formato_participacion as enum (
  'ponencia_general', 'conversatorio', 'workshop', 'pregunta_en_vivo', 'live_selling'
);

create type estado_postulacion as enum (
  'pendiente_revision', 'aceptado', 'rechazado', 'mas_info'
);

-- ---------- Tablas ---------------------------------------------------------
create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  nombre text not null,
  rol_base rol_base not null default 'colaborador',
  avatar_url text,
  creado_en timestamptz not null default now()
);
comment on table usuarios is 'Perfil del equipo. id == auth.users.id.';

create table areas (
  id uuid primary key default gen_random_uuid(),
  nombre area_nombre not null unique,
  descripcion text
);

create table usuario_areas (
  usuario_id uuid not null references usuarios (id) on delete cascade,
  area_id uuid not null references areas (id) on delete cascade,
  nivel_acceso nivel_acceso not null default 'lectura',
  primary key (usuario_id, area_id)
);
comment on table usuario_areas is 'Define qué ve/edita cada persona por área.';

create table tareas (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references areas (id) on delete cascade,
  titulo text not null,
  descripcion text,
  estado estado_tarea not null default 'pendiente',
  responsable_id uuid references usuarios (id) on delete set null,
  fecha_limite date,
  prioridad prioridad not null default 'media',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index tareas_area_idx on tareas (area_id);
create index tareas_estado_idx on tareas (estado);

create table tareas_transversales (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  estado estado_tarea not null default 'pendiente',
  responsable_id uuid references usuarios (id) on delete set null,
  fecha_limite date,
  prioridad prioridad not null default 'media',
  areas_involucradas uuid[] not null default '{}',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index tareas_transv_areas_idx on tareas_transversales using gin (areas_involucradas);

create table postulaciones_ponentes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tema_propuesto text not null,
  formato_participacion formato_participacion not null,
  experiencia_previa text,
  video_url text,
  ig text,
  tiktok text,
  linkedin text,
  facebook text,
  youtube text,
  estado estado_postulacion not null default 'pendiente_revision',
  creado_en timestamptz not null default now()
);

-- ---------- Funciones helper (SECURITY DEFINER, sin recursión de RLS) -------
create or replace function es_admin_global()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from usuarios
    where id = auth.uid() and rol_base in ('directivo', 'administrativo')
  );
$$;

create or replace function es_directivo()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol_base = 'directivo'
  );
$$;

create or replace function puede_ver_area(p_area uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select es_admin_global() or exists (
    select 1 from usuario_areas
    where usuario_id = auth.uid() and area_id = p_area
  );
$$;

create or replace function puede_editar_area(p_area uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select es_admin_global() or exists (
    select 1 from usuario_areas
    where usuario_id = auth.uid() and area_id = p_area
      and nivel_acceso in ('edicion', 'admin')
  );
$$;

-- ---------- Trigger: crear perfil al registrarse ---------------------------
-- Al crear el usuario en auth (contraseña o enlace) se crea su fila en `usuarios`.
-- Si el correo fue pre-sembrado, respeta el id del usuario de auth.
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into usuarios (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  )
  on conflict (email) do update set id = excluded.id;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Mantener actualizado_en
create or replace function touch_actualizado_en()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end;
$$;
create trigger tareas_touch before update on tareas
  for each row execute function touch_actualizado_en();
create trigger tareas_transv_touch before update on tareas_transversales
  for each row execute function touch_actualizado_en();

-- ============================================================================
-- RLS — activado en todas las tablas + políticas explícitas
-- ============================================================================
alter table usuarios enable row level security;
alter table areas enable row level security;
alter table usuario_areas enable row level security;
alter table tareas enable row level security;
alter table tareas_transversales enable row level security;
alter table postulaciones_ponentes enable row level security;

-- usuarios: el equipo autenticado puede leer perfiles (para mostrar responsables).
create policy usuarios_select on usuarios
  for select to authenticated using (true);
-- cada quien edita su propio perfil; los admin gestionan todos (Fase 1).
create policy usuarios_update_propio on usuarios
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy usuarios_admin_all on usuarios
  for all to authenticated using (es_admin_global()) with check (es_admin_global());

-- areas: referencia; lectura para autenticados, gestión solo admin_global.
create policy areas_select on areas
  for select to authenticated using (true);
create policy areas_admin on areas
  for all to authenticated using (es_admin_global()) with check (es_admin_global());

-- usuario_areas: cada quien ve sus asignaciones; admin gestiona todo.
create policy ua_select_propio on usuario_areas
  for select to authenticated using (usuario_id = auth.uid() or es_admin_global());
create policy ua_admin on usuario_areas
  for all to authenticated using (es_admin_global()) with check (es_admin_global());

-- tareas: ver si puede ver el área; editar si puede editar el área.
create policy tareas_select on tareas
  for select to authenticated using (puede_ver_area(area_id));
create policy tareas_insert on tareas
  for insert to authenticated with check (puede_editar_area(area_id));
create policy tareas_update on tareas
  for update to authenticated using (puede_editar_area(area_id)) with check (puede_editar_area(area_id));
create policy tareas_delete on tareas
  for delete to authenticated using (puede_editar_area(area_id));

-- tareas_transversales: acceso si alguna de sus áreas es visible/editable.
create policy tareas_transv_select on tareas_transversales
  for select to authenticated using (
    es_admin_global() or exists (
      select 1 from unnest(areas_involucradas) a where puede_ver_area(a)
    )
  );
create policy tareas_transv_write on tareas_transversales
  for all to authenticated using (
    es_admin_global() or exists (
      select 1 from unnest(areas_involucradas) a where puede_editar_area(a)
    )
  ) with check (
    es_admin_global() or exists (
      select 1 from unnest(areas_involucradas) a where puede_editar_area(a)
    )
  );

-- postulaciones_ponentes:
--   * el público (anon) SOLO puede crear su postulación en estado pendiente_revision.
--   * solo quien puede ver/editar el área 'ponentes' (Sandra + admins) la lee/gestiona.
create policy postulaciones_insert_publico on postulaciones_ponentes
  for insert to anon, authenticated
  with check (estado = 'pendiente_revision');
create policy postulaciones_select_ponentes on postulaciones_ponentes
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'ponentes'))
  );
create policy postulaciones_manage_ponentes on postulaciones_ponentes
  for update to authenticated using (
    puede_editar_area((select id from areas where nombre = 'ponentes'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'ponentes'))
  );

-- ---------- Semilla: las 11 áreas ------------------------------------------
insert into areas (nombre) values
  ('ponentes'), ('stands'), ('patrocinios'), ('logistica'), ('diseno'),
  ('video'), ('produccion'), ('finanzas'), ('estrategia'), ('marketing'),
  ('alianzas'), ('comunidades')
on conflict (nombre) do nothing;

-- ---------- Grants de tabla (RLS controla filas; GRANT controla acceso) -----
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  usuarios, areas, usuario_areas, tareas, tareas_transversales,
  postulaciones_ponentes
  to authenticated;
-- El público (anon) solo puede crear su postulación (la RLS la limita más).
grant insert on postulaciones_ponentes to anon;
