-- ============================================================================
-- Feria Effix 2026 — Pipelines propios por área (Diseño, Video, Producción, Marketing)
-- + estado_implementacion en decisiones_estrategicas.  RLS por área.
-- (La migración de datos de `tareas` se hace aparte, no acá, por el orden de seed.)
-- ============================================================================

create type tipo_pieza_diseno as enum ('escarapela', 'banner', 'redes_sociales', 'impreso', 'senaletica', 'otro');
create type prioridad_diseno as enum ('baja', 'media', 'alta', 'urgente');
create type etapa_diseno as enum ('solicitado', 'en_diseno', 'en_revision', 'aprobado', 'entregado');
create type tipo_video as enum ('testimonio', 'backstage', 'ponente', 'recap', 'publicitario');
create type etapa_video as enum ('guion', 'grabacion', 'edicion', 'revision', 'publicado');
create type categoria_produccion as enum ('montaje', 'sonido', 'escenario', 'catering', 'transporte', 'senaletica_fisica');
create type etapa_produccion as enum ('planeado', 'cotizado', 'contratado', 'en_ejecucion', 'completado');
create type canal_marketing as enum ('meta_ads', 'google_ads', 'organico_instagram', 'organico_tiktok', 'email', 'whatsapp', 'influencers', 'otro');
create type etapa_marketing as enum ('idea', 'en_diseno', 'programado', 'activo', 'finalizado', 'analizado');
create type estado_implementacion as enum ('propuesta', 'aprobada', 'en_ejecucion', 'implementada');

-- ---------- Diseño ---------------------------------------------------------
create table solicitudes_diseno (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  area_solicitante uuid references areas (id) on delete set null,
  tipo_pieza tipo_pieza_diseno not null default 'otro',
  prioridad prioridad_diseno not null default 'media',
  etapa etapa_diseno not null default 'solicitado',
  fecha_limite date,
  archivo_entregable_id uuid references biblioteca_archivos (id) on delete set null,
  responsable_id uuid references usuarios (id) on delete set null,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger sd_touch before update on solicitudes_diseno for each row execute function touch_actualizado_en();

-- ---------- Video ----------------------------------------------------------
create table piezas_video (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo tipo_video not null default 'recap',
  etapa etapa_video not null default 'guion',
  campana_relacionada text,
  fecha_publicacion_objetivo date,
  archivo_final_id uuid references biblioteca_archivos (id) on delete set null,
  responsable_id uuid references usuarios (id) on delete set null,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger pv_touch before update on piezas_video for each row execute function touch_actualizado_en();

-- ---------- Producción -----------------------------------------------------
create table items_produccion (
  id uuid primary key default gen_random_uuid(),
  descripcion text not null,
  categoria categoria_produccion not null default 'montaje',
  etapa etapa_produccion not null default 'planeado',
  proveedor text,
  costo_estimado numeric(14, 2),
  costo_real numeric(14, 2),
  fecha_requerida date,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger ip_touch before update on items_produccion for each row execute function touch_actualizado_en();

-- ---------- Marketing ------------------------------------------------------
create table iniciativas_marketing (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  canal canal_marketing not null default 'otro',
  etapa etapa_marketing not null default 'idea',
  presupuesto_asignado numeric(14, 2),
  resultado_principal text,
  fecha_inicio date,
  fecha_fin date,
  responsable_id uuid references usuarios (id) on delete set null,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create trigger im_touch before update on iniciativas_marketing for each row execute function touch_actualizado_en();

-- ---------- Estrategia: medir avance de decisiones -------------------------
alter table decisiones_estrategicas
  add column if not exists estado_implementacion estado_implementacion not null default 'propuesta';

-- ============================================================================
-- RLS por área + grants
-- ============================================================================
alter table solicitudes_diseno enable row level security;
alter table piezas_video enable row level security;
alter table items_produccion enable row level security;
alter table iniciativas_marketing enable row level security;

do $pl$
declare rec record;
begin
  for rec in select * from (values
      ('solicitudes_diseno','diseno'),
      ('piezas_video','video'),
      ('items_produccion','produccion'),
      ('iniciativas_marketing','marketing')
    ) as x(tabla, area) loop
    execute format($f$
      create policy %1$s_sel on %1$s for select to authenticated
        using (puede_ver_area((select id from areas where nombre = %2$L)));
      create policy %1$s_wr on %1$s for all to authenticated
        using (puede_editar_area((select id from areas where nombre = %2$L)))
        with check (puede_editar_area((select id from areas where nombre = %2$L)));
    $f$, rec.tabla, rec.area);
  end loop;
end $pl$;

grant select, insert, update, delete on
  solicitudes_diseno, piezas_video, items_produccion, iniciativas_marketing
  to authenticated;
