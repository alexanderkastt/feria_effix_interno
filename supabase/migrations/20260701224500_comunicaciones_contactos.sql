-- ============================================================================
-- Feria Effix 2026 — Comunicaciones · Bloque A: contactos unificados
-- Tablas: contactos, contacto_origen, audiencias, audiencia_contactos
-- + campos de contacto en tablas de origen + sync automático sin duplicados
-- + consentimiento (Ley 1581): opt-in por defecto.
-- ============================================================================

create type tipo_contacto as enum (
  'comprador_boleta', 'postulante_ponente', 'cliente_stand', 'patrocinador',
  'aliado', 'comunidad', 'embajador', 'otro'
);
create type tipo_audiencia as enum ('manual', 'dinamica');

-- ---------- Tabla central de contactos -------------------------------------
create table contactos (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  email text,
  telefono_whatsapp text,
  tipo_contacto tipo_contacto not null default 'otro',
  consentimiento_marketing boolean not null default false,
  fecha_consentimiento timestamptz,
  origen_consentimiento text,
  pais text,
  tags text[] not null default '{}',
  creado_en timestamptz not null default now(),
  ultima_interaccion timestamptz not null default now()
);
-- Unicidad por email normalizado (case-insensitive). NULLs no colisionan.
create unique index contactos_email_uq on contactos (lower(email));
create index contactos_tipo_idx on contactos (tipo_contacto);
create index contactos_consent_idx on contactos (consentimiento_marketing);

comment on column contactos.consentimiento_marketing is
  'Ley 1581: opt-in. Solo true entra a campañas masivas. Default false.';

-- ---------- Trazabilidad de origen -----------------------------------------
create table contacto_origen (
  id uuid primary key default gen_random_uuid(),
  contacto_id uuid not null references contactos (id) on delete cascade,
  tabla_origen text not null,
  registro_origen_id uuid not null,
  creado_en timestamptz not null default now(),
  unique (contacto_id, tabla_origen, registro_origen_id)
);

-- ---------- Audiencias ------------------------------------------------------
create table audiencias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  tipo tipo_audiencia not null default 'manual',
  filtro jsonb,               -- solo para dinámicas: {tipo_contacto, tags, pais, ...}
  creada_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table audiencia_contactos (
  audiencia_id uuid not null references audiencias (id) on delete cascade,
  contacto_id uuid not null references contactos (id) on delete cascade,
  primary key (audiencia_id, contacto_id)
);

-- ---------- Campos de contacto en las tablas de origen ----------------------
-- (para que el sync tenga de dónde tomar el email/teléfono)
alter table postulaciones_ponentes add column if not exists email text;
alter table postulaciones_ponentes add column if not exists telefono text;
alter table patrocinios add column if not exists contacto_email text;
alter table patrocinios add column if not exists contacto_telefono text;
alter table contactos_pipeline add column if not exists email text;
alter table contactos_pipeline add column if not exists telefono text;

-- ============================================================================
-- Sincronización automática hacia `contactos` (sin duplicar por email)
-- ============================================================================
create or replace function upsert_contacto(
  p_nombre text, p_email text, p_tel text, p_tipo tipo_contacto,
  p_tabla text, p_reg uuid, p_tag text
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  -- Solo sincronizamos contactos con email (es la llave de unicidad).
  if p_email is null or length(trim(p_email)) = 0 then
    return;
  end if;

  insert into contactos (nombre, email, telefono_whatsapp, tipo_contacto, tags, ultima_interaccion)
  values (nullif(trim(p_nombre), ''), lower(trim(p_email)), p_tel, p_tipo,
          case when p_tag is null then '{}'::text[] else array[p_tag] end, now())
  on conflict (lower(email)) do update
    set ultima_interaccion = now(),
        nombre = coalesce(contactos.nombre, excluded.nombre),
        telefono_whatsapp = coalesce(contactos.telefono_whatsapp, excluded.telefono_whatsapp),
        tags = (select array(select distinct e from unnest(contactos.tags || excluded.tags) e))
  returning id into v_id;

  insert into contacto_origen (contacto_id, tabla_origen, registro_origen_id)
  values (v_id, p_tabla, p_reg)
  on conflict (contacto_id, tabla_origen, registro_origen_id) do nothing;
end;
$$;

create or replace function trg_sync_contacto() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'stands' then
    perform upsert_contacto(new.cliente_nombre, new.cliente_email, new.cliente_telefono,
                            'cliente_stand', 'stands', new.id, 'stand:' || new.codigo);
  elsif tg_table_name = 'patrocinios' then
    perform upsert_contacto(new.empresa, new.contacto_email, new.contacto_telefono,
                            'patrocinador', 'patrocinios', new.id, 'patrocinio:' || new.empresa);
  elsif tg_table_name = 'postulaciones_ponentes' then
    perform upsert_contacto(new.nombre, new.email, new.telefono,
                            'postulante_ponente', 'postulaciones_ponentes', new.id, 'ponente');
  elsif tg_table_name = 'contactos_pipeline' then
    perform upsert_contacto(new.nombre_entidad, new.email, new.telefono,
                            case new.tipo when 'alianza' then 'aliado'::tipo_contacto
                                          else 'comunidad'::tipo_contacto end,
                            'contactos_pipeline', new.id, new.tipo::text);
  end if;
  return new;
end;
$$;

create trigger sync_contacto_stands after insert or update on stands
  for each row execute function trg_sync_contacto();
create trigger sync_contacto_patrocinios after insert or update on patrocinios
  for each row execute function trg_sync_contacto();
create trigger sync_contacto_postulaciones after insert or update on postulaciones_ponentes
  for each row execute function trg_sync_contacto();
create trigger sync_contacto_pipeline after insert or update on contactos_pipeline
  for each row execute function trg_sync_contacto();

-- ============================================================================
-- RLS — contactos es PII sensible → área marketing (o admin)
-- ============================================================================
alter table contactos enable row level security;
alter table contacto_origen enable row level security;
alter table audiencias enable row level security;
alter table audiencia_contactos enable row level security;

create policy contactos_select on contactos for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'marketing')));
create policy contactos_write on contactos for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'marketing')))
  with check (puede_editar_area((select id from areas where nombre = 'marketing')));

create policy co_select on contacto_origen for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'marketing')));
create policy co_write on contacto_origen for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'marketing')))
  with check (puede_editar_area((select id from areas where nombre = 'marketing')));

create policy aud_select on audiencias for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'marketing')));
create policy aud_write on audiencias for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'marketing')))
  with check (puede_editar_area((select id from areas where nombre = 'marketing')));

create policy audc_select on audiencia_contactos for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'marketing')));
create policy audc_write on audiencia_contactos for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'marketing')))
  with check (puede_editar_area((select id from areas where nombre = 'marketing')));

grant select, insert, update, delete on
  contactos, contacto_origen, audiencias, audiencia_contactos to authenticated;

-- ---------- Backfill: clientes de stand existentes con email ----------------
do $$
declare r record;
begin
  for r in select id, codigo, cliente_nombre, cliente_email, cliente_telefono
           from stands where cliente_email is not null loop
    perform upsert_contacto(r.cliente_nombre, r.cliente_email, r.cliente_telefono,
                            'cliente_stand', 'stands', r.id, 'stand:' || r.codigo);
  end loop;
end $$;
