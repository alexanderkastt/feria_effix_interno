-- ============================================================================
-- Feria Effix 2026 — Comunicaciones · Bloques B, C, D, F
-- B: email (plantillas, campañas, envíos) · C: automatizaciones (outbox n8n)
-- D: WhatsApp (plantillas, campañas, envíos) · F: notificaciones internas
-- RLS activo en todo. Consentimiento y transaccional respetados a nivel datos.
-- ============================================================================

-- ---------- Enums ----------------------------------------------------------
create type estado_campana_email as enum ('borrador', 'programada', 'enviando', 'enviada', 'pausada');
create type estado_envio_email as enum ('pendiente', 'enviado', 'entregado', 'abierto', 'click', 'rebotado', 'desuscrito');
create type categoria_whatsapp as enum ('marketing', 'utilidad', 'autenticacion');
create type estado_aprobacion_meta as enum ('pendiente', 'aprobada', 'rechazada');
create type estado_campana_wa as enum ('borrador', 'programada', 'enviando', 'enviada', 'pausada');
create type estado_envio_wa as enum ('enviado', 'entregado', 'leido', 'respondido', 'fallido');
create type evento_comunicacion as enum (
  'stand_reservado', 'stand_vendido', 'ponente_aceptado', 'ponente_rechazado',
  'patrocinio_pagado', 'boleta_comprada'
);
create type tipo_notificacion as enum (
  'tarea_asignada', 'tarea_vencida', 'aprobacion_pendiente', 'pago_recibido',
  'postulacion_nueva', 'mencion'
);

-- ============================================================================
-- BLOQUE B — Email
-- ============================================================================
create table plantillas_email (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  asunto text not null,
  contenido_html text,
  contenido_texto text,               -- versión texto plano (entregabilidad)
  variables_usadas text[] not null default '{}',
  es_transaccional boolean not null default false,
  area_relacionada uuid references areas (id) on delete set null,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table campanas_email (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plantilla_id uuid references plantillas_email (id) on delete set null,
  audiencia_id uuid references audiencias (id) on delete set null,
  estado estado_campana_email not null default 'borrador',
  prueba_enviada boolean not null default false,   -- gate: envío real bloqueado sin prueba
  fecha_programada timestamptz,
  fecha_enviada timestamptz,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table envios_email (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid references campanas_email (id) on delete set null,
  contacto_id uuid references contactos (id) on delete set null,
  email text not null,
  estado estado_envio_email not null default 'pendiente',
  es_transaccional boolean not null default false,
  proveedor_message_id text,
  fecha_evento timestamptz,
  creado_en timestamptz not null default now()
);
create index envios_email_campana_idx on envios_email (campana_id);

-- ============================================================================
-- BLOQUE C — Automatizaciones (outbox que n8n consume; sin credenciales aquí)
-- ============================================================================
create table automatizaciones (
  id uuid primary key default gen_random_uuid(),
  evento evento_comunicacion not null unique,
  plantilla_id uuid references plantillas_email (id) on delete set null,
  activa boolean not null default false,
  creado_en timestamptz not null default now()
);

-- Cola de eventos: los triggers la llenan; n8n la lee y dispara el correo real.
create table eventos_comunicacion (
  id uuid primary key default gen_random_uuid(),
  evento evento_comunicacion not null,
  registro_id uuid,
  payload jsonb not null default '{}',
  procesado boolean not null default false,
  creado_en timestamptz not null default now()
);
create index eventos_com_pend_idx on eventos_comunicacion (procesado, creado_en);

-- Encola un evento SOLO si su automatización está activa.
create or replace function encolar_evento_com(p_evento evento_comunicacion, p_reg uuid, p_payload jsonb)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from automatizaciones where evento = p_evento and activa) then
    insert into eventos_comunicacion (evento, registro_id, payload)
    values (p_evento, p_reg, p_payload);
  end if;
end;
$$;

create or replace function trg_evento_com() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_table_name = 'stands' then
    if new.estado = 'reservado' and old.estado is distinct from 'reservado' then
      perform encolar_evento_com('stand_reservado', new.id,
        jsonb_build_object('codigo', new.codigo, 'cliente', new.cliente_nombre, 'email', new.cliente_email));
    elsif new.estado = 'vendido' and old.estado is distinct from 'vendido' then
      perform encolar_evento_com('stand_vendido', new.id,
        jsonb_build_object('codigo', new.codigo, 'email', new.cliente_email));
    end if;
  elsif tg_table_name = 'postulaciones_ponentes' then
    if new.estado = 'aceptado' and old.estado is distinct from 'aceptado' then
      perform encolar_evento_com('ponente_aceptado', new.id,
        jsonb_build_object('nombre', new.nombre, 'email', new.email));
    elsif new.estado = 'rechazado' and old.estado is distinct from 'rechazado' then
      perform encolar_evento_com('ponente_rechazado', new.id,
        jsonb_build_object('nombre', new.nombre, 'email', new.email));
    end if;
  elsif tg_table_name = 'patrocinios' then
    if new.estado_pago = 'pagado' and old.estado_pago is distinct from 'pagado' then
      perform encolar_evento_com('patrocinio_pagado', new.id,
        jsonb_build_object('empresa', new.empresa, 'email', new.contacto_email));
    end if;
  end if;
  return new;
end;
$$;
create trigger evento_com_stands after update on stands
  for each row execute function trg_evento_com();
create trigger evento_com_postulaciones after update on postulaciones_ponentes
  for each row execute function trg_evento_com();
create trigger evento_com_patrocinios after update on patrocinios
  for each row execute function trg_evento_com();

-- Semilla de automatizaciones (todas inactivas: se activan de a una)
insert into automatizaciones (evento, activa) values
  ('stand_reservado', false), ('stand_vendido', false),
  ('ponente_aceptado', false), ('ponente_rechazado', false),
  ('patrocinio_pagado', false), ('boleta_comprada', false)
on conflict (evento) do nothing;

-- ============================================================================
-- BLOQUE D — WhatsApp
-- ============================================================================
create table plantillas_whatsapp (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria categoria_whatsapp not null default 'marketing',
  texto_aprobado text,
  variables_usadas text[] not null default '{}',
  estado_aprobacion_meta estado_aprobacion_meta not null default 'pendiente',
  meta_template_id text,
  disparar_flujo_lucy boolean not null default false,
  creado_en timestamptz not null default now()
);

create table campanas_whatsapp (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  plantilla_id uuid references plantillas_whatsapp (id) on delete set null,
  audiencia_id uuid references audiencias (id) on delete set null,
  estado estado_campana_wa not null default 'borrador',
  fecha_programada timestamptz,
  fecha_enviada timestamptz,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table envios_whatsapp (
  id uuid primary key default gen_random_uuid(),
  campana_id uuid references campanas_whatsapp (id) on delete set null,
  contacto_id uuid references contactos (id) on delete set null,
  telefono text not null,
  estado estado_envio_wa not null default 'enviado',
  proveedor_message_id text,
  fecha_evento timestamptz,
  creado_en timestamptz not null default now()
);

-- ============================================================================
-- BLOQUE F — Notificaciones internas
-- ============================================================================
alter table usuarios add column if not exists notif_por_email boolean not null default false;

create table notificaciones_internas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  tipo tipo_notificacion not null,
  titulo text not null,
  mensaje text,
  url_relacionada text,
  leida boolean not null default false,
  creado_en timestamptz not null default now()
);
create index notif_usuario_idx on notificaciones_internas (usuario_id, leida, creado_en desc);

create or replace function notificar(p_usuario uuid, p_tipo tipo_notificacion, p_titulo text, p_msg text, p_url text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if p_usuario is null then return; end if;
  insert into notificaciones_internas (usuario_id, tipo, titulo, mensaje, url_relacionada)
  values (p_usuario, p_tipo, p_titulo, p_msg, p_url);
end;
$$;

-- Tarea asignada → notifica al responsable
create or replace function trg_notif_tarea() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.responsable_id is not null
     and (tg_op = 'INSERT' or new.responsable_id is distinct from old.responsable_id) then
    perform notificar(new.responsable_id, 'tarea_asignada',
      'Nueva tarea asignada', new.titulo, '/panel');
  end if;
  return new;
end;
$$;
create trigger notif_tarea_asignada after insert or update on tareas
  for each row execute function trg_notif_tarea();

-- Gasto presupuestado → notifica a los admin (aprobación pendiente)
create or replace function trg_notif_gasto() returns trigger
language plpgsql security definer set search_path = public
as $$
declare u record;
begin
  if tg_op = 'INSERT' and new.estado = 'presupuestado' then
    for u in select id from usuarios where rol_base in ('directivo', 'administrativo') loop
      perform notificar(u.id, 'aprobacion_pendiente',
        'Gasto pendiente de aprobación', new.concepto, '/panel/finanzas');
    end loop;
  end if;
  return new;
end;
$$;
create trigger notif_gasto_pendiente after insert on gastos
  for each row execute function trg_notif_gasto();

-- Patrocinio pagado → notifica a los admin (pago recibido)
create or replace function trg_notif_patrocinio() returns trigger
language plpgsql security definer set search_path = public
as $$
declare u record;
begin
  if new.estado_pago = 'pagado' and old.estado_pago is distinct from 'pagado' then
    for u in select id from usuarios where rol_base in ('directivo', 'administrativo') loop
      perform notificar(u.id, 'pago_recibido',
        'Patrocinio pagado', new.empresa, '/panel/patrocinios');
    end loop;
  end if;
  return new;
end;
$$;
create trigger notif_patrocinio_pagado after update on patrocinios
  for each row execute function trg_notif_patrocinio();

-- ============================================================================
-- RLS + grants
-- ============================================================================
alter table plantillas_email enable row level security;
alter table campanas_email enable row level security;
alter table envios_email enable row level security;
alter table automatizaciones enable row level security;
alter table eventos_comunicacion enable row level security;
alter table plantillas_whatsapp enable row level security;
alter table campanas_whatsapp enable row level security;
alter table envios_whatsapp enable row level security;
alter table notificaciones_internas enable row level security;

-- Email / WhatsApp / automatizaciones: área marketing (o admin)
do $mkt$
declare t text;
begin
  foreach t in array array['plantillas_email','campanas_email','envios_email',
                           'plantillas_whatsapp','campanas_whatsapp','envios_whatsapp',
                           'automatizaciones','eventos_comunicacion'] loop
    execute format($f$
      create policy %1$s_sel on %1$s for select to authenticated
        using (puede_ver_area((select id from areas where nombre = 'marketing')));
      create policy %1$s_wr on %1$s for all to authenticated
        using (puede_editar_area((select id from areas where nombre = 'marketing')))
        with check (puede_editar_area((select id from areas where nombre = 'marketing')));
    $f$, t);
  end loop;
end $mkt$;

-- Notificaciones: cada quien ve/actualiza SOLO las suyas.
create policy notif_select on notificaciones_internas for select to authenticated
  using (usuario_id = auth.uid());
create policy notif_update on notificaciones_internas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

grant select, insert, update, delete on
  plantillas_email, campanas_email, envios_email, automatizaciones,
  eventos_comunicacion, plantillas_whatsapp, campanas_whatsapp, envios_whatsapp,
  notificaciones_internas
  to authenticated;
