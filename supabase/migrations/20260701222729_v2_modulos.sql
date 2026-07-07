-- ============================================================================
-- Feria Effix 2026 — Módulos v2 (Bloques A, B, C, D, E, F)
-- Autor lógico: db-architect
-- Tablas: datos_historicos_marketing, contexto_evento, ingresos, gastos,
--         presupuesto_general, contactos_pipeline, decisiones_estrategicas,
--         biblioteca_archivos + triggers de auto-ingreso + búsqueda global.
-- RLS activo en todas.
-- ============================================================================

-- ---------- Enums ----------------------------------------------------------
create type fuente_ingreso as enum ('boleteria', 'stands', 'patrocinios', 'otros');
create type estado_ingreso as enum ('proyectado', 'confirmado', 'cobrado');
create type categoria_gasto as enum ('produccion', 'logistica', 'marketing', 'talento', 'tecnologia', 'alianzas', 'otros');
create type estado_gasto as enum ('presupuestado', 'aprobado', 'pagado');
create type tipo_pipeline as enum ('alianza', 'comunidad');
create type etapa_pipeline as enum ('contactado', 'propuesta_enviada', 'negociacion', 'cerrado', 'descartado');
create type tipo_archivo as enum ('logo', 'video', 'documento', 'contrato', 'plano', 'foto', 'otro');

-- ============================================================================
-- BLOQUE A — Contexto y datos históricos
-- ============================================================================
create table contexto_evento (
  id uuid primary key default gen_random_uuid(),
  edicion text not null unique,
  fecha_inicio date,
  fecha_fin date,
  ubicacion text,
  meta_asistencia integer,
  precio_boleta numeric(12, 2),
  google_ads_id text,
  ga4_id text,
  gtm_id text,
  meta_pixel_id text,
  notas text,
  actualizado_en timestamptz not null default now()
);

create table datos_historicos_marketing (
  id uuid primary key default gen_random_uuid(),
  campana text,
  edad text,
  sexo text,
  anuncios integer,
  objetivo text,
  alcance bigint,
  gasto_cop numeric(14, 2),
  resultados integer,
  costo_por_resultado numeric(14, 2),
  ctr numeric(8, 4),
  cvr numeric(8, 4),
  fecha date,
  importado_por uuid references usuarios (id) on delete set null,
  importado_en timestamptz not null default now()
);
create index dhm_campana_idx on datos_historicos_marketing (campana);

-- ============================================================================
-- BLOQUE B — Finanzas
-- ============================================================================
create table ingresos (
  id uuid primary key default gen_random_uuid(),
  fuente fuente_ingreso not null,
  concepto text not null,
  monto numeric(14, 2) not null default 0,
  moneda text not null default 'COP',
  fecha date not null default current_date,
  estado estado_ingreso not null default 'proyectado',
  referencia_id uuid,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index ingresos_fuente_idx on ingresos (fuente);
-- Evita duplicar el ingreso auto-generado por stand/patrocinio.
create unique index ingresos_ref_unico
  on ingresos (fuente, referencia_id)
  where referencia_id is not null;

create table gastos (
  id uuid primary key default gen_random_uuid(),
  categoria categoria_gasto not null,
  concepto text not null,
  monto numeric(14, 2) not null default 0,
  moneda text not null default 'COP',
  fecha date not null default current_date,
  proveedor text,
  estado estado_gasto not null default 'presupuestado',
  area_id uuid references areas (id) on delete set null,
  aprobado_por uuid references usuarios (id) on delete set null,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);

create table presupuesto_general (
  id uuid primary key default gen_random_uuid(),
  categoria categoria_gasto not null,
  monto_asignado numeric(14, 2) not null default 0,
  edicion text not null default '2026',
  notas text,
  unique (categoria, edicion)
);

-- Auto-ingreso: stand → vendido. No duplica (ON CONFLICT sobre índice único).
create or replace function ingreso_por_stand()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.estado = 'vendido' and (old.estado is distinct from 'vendido') then
    insert into ingresos (fuente, concepto, monto, estado, referencia_id)
    values ('stands', 'Venta stand ' || new.codigo, new.precio, 'confirmado', new.id)
    on conflict (fuente, referencia_id) where referencia_id is not null do nothing;
  end if;
  return new;
end;
$$;
create trigger stands_ingreso_trg after update on stands
  for each row execute function ingreso_por_stand();

-- Auto-ingreso: patrocinio → pagado.
create or replace function ingreso_por_patrocinio()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.estado_pago = 'pagado' and (old.estado_pago is distinct from 'pagado') then
    insert into ingresos (fuente, concepto, monto, estado, referencia_id)
    values ('patrocinios', 'Patrocinio ' || new.empresa, new.monto, 'cobrado', new.id)
    on conflict (fuente, referencia_id) where referencia_id is not null do nothing;
  end if;
  return new;
end;
$$;
create trigger patrocinios_ingreso_trg after update on patrocinios
  for each row execute function ingreso_por_patrocinio();

-- ============================================================================
-- BLOQUE D — Pipelines y decisiones
-- ============================================================================
create table contactos_pipeline (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_pipeline not null,
  nombre_entidad text not null,
  tipo_entidad text,
  responsable_id uuid references usuarios (id) on delete set null,
  etapa etapa_pipeline not null default 'contactado',
  pais text,
  notas text,
  codigo_descuento text,
  fecha_corte_codigo date default date '2026-09-30',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);
create index cp_tipo_idx on contactos_pipeline (tipo);
create trigger cp_touch before update on contactos_pipeline
  for each row execute function touch_actualizado_en();

create table decisiones_estrategicas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contexto text,
  decision_tomada text,
  responsable_id uuid references usuarios (id) on delete set null,
  fecha date not null default current_date,
  tags text[] not null default '{}',
  creado_en timestamptz not null default now()
);
create index de_tags_idx on decisiones_estrategicas using gin (tags);

-- ============================================================================
-- BLOQUE E — Biblioteca de archivos
-- ============================================================================
create table biblioteca_archivos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo tipo_archivo not null default 'otro',
  area_relacionada uuid references areas (id) on delete set null,
  drive_file_id text,
  drive_url text,
  miniatura_url text,
  tags text[] not null default '{}',
  subido_por uuid references usuarios (id) on delete set null,
  subido_en timestamptz not null default now(),
  tamano_bytes bigint,
  mime_type text
);
create index ba_tipo_idx on biblioteca_archivos (tipo);
create index ba_area_idx on biblioteca_archivos (area_relacionada);
create index ba_tags_idx on biblioteca_archivos using gin (tags);

-- ============================================================================
-- RLS
-- ============================================================================
alter table contexto_evento enable row level security;
alter table datos_historicos_marketing enable row level security;
alter table ingresos enable row level security;
alter table gastos enable row level security;
alter table presupuesto_general enable row level security;
alter table contactos_pipeline enable row level security;
alter table decisiones_estrategicas enable row level security;
alter table biblioteca_archivos enable row level security;

-- contexto_evento: lectura para todo el equipo; gestión solo admin.
create policy ctx_select on contexto_evento for select to authenticated using (true);
create policy ctx_admin on contexto_evento for all to authenticated
  using (es_admin_global()) with check (es_admin_global());

-- datos_historicos_marketing: quien ve/edita marketing (o admin).
create policy dhm_select on datos_historicos_marketing for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'marketing')));
create policy dhm_write on datos_historicos_marketing for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'marketing')))
  with check (puede_editar_area((select id from areas where nombre = 'marketing')));

-- ingresos: ve quien ve finanzas (o admin). Crea admin/finanzas. Los auto-ingresos
-- entran por trigger (SECURITY DEFINER, no pasa por RLS).
create policy ing_select on ingresos for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'finanzas')));
create policy ing_write on ingresos for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'finanzas')))
  with check (puede_editar_area((select id from areas where nombre = 'finanzas')));

-- gastos:
--   select: admin ve todo; gestor ve los de sus áreas.
--   insert: cualquiera con edición del área, SOLO en estado 'presupuestado'.
--   update/delete: SOLO admin (aprobar/pagar). Un gestor NO aprueba sus gastos.
create policy gastos_select on gastos for select to authenticated using (
  es_admin_global() or (area_id is not null and puede_ver_area(area_id))
);
create policy gastos_insert on gastos for insert to authenticated with check (
  estado = 'presupuestado'
  and (es_admin_global() or (area_id is not null and puede_editar_area(area_id)))
);
create policy gastos_update_admin on gastos for update to authenticated
  using (es_admin_global()) with check (es_admin_global());
create policy gastos_delete_admin on gastos for delete to authenticated
  using (es_admin_global());

-- presupuesto_general: ve finanzas; gestiona admin.
create policy pg_select on presupuesto_general for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'finanzas')));
create policy pg_admin on presupuesto_general for all to authenticated
  using (es_admin_global()) with check (es_admin_global());

-- contactos_pipeline: alianza→área alianzas, comunidad→área comunidades.
create policy cp_select on contactos_pipeline for select to authenticated using (
  es_admin_global()
  or (tipo = 'alianza' and puede_ver_area((select id from areas where nombre = 'alianzas')))
  or (tipo = 'comunidad' and puede_ver_area((select id from areas where nombre = 'comunidades')))
);
create policy cp_write on contactos_pipeline for all to authenticated using (
  es_admin_global()
  or (tipo = 'alianza' and puede_editar_area((select id from areas where nombre = 'alianzas')))
  or (tipo = 'comunidad' and puede_editar_area((select id from areas where nombre = 'comunidades')))
) with check (
  es_admin_global()
  or (tipo = 'alianza' and puede_editar_area((select id from areas where nombre = 'alianzas')))
  or (tipo = 'comunidad' and puede_editar_area((select id from areas where nombre = 'comunidades')))
);

-- decisiones_estrategicas: área estrategia (o admin).
create policy de_select on decisiones_estrategicas for select to authenticated
  using (puede_ver_area((select id from areas where nombre = 'estrategia')));
create policy de_write on decisiones_estrategicas for all to authenticated
  using (puede_editar_area((select id from areas where nombre = 'estrategia')))
  with check (puede_editar_area((select id from areas where nombre = 'estrategia')));

-- biblioteca_archivos: todo el equipo lee; sube cualquiera; edita/borra el dueño o admin.
create policy ba_select on biblioteca_archivos for select to authenticated using (true);
create policy ba_insert on biblioteca_archivos for insert to authenticated
  with check (subido_por = auth.uid() or es_admin_global());
create policy ba_update on biblioteca_archivos for update to authenticated
  using (subido_por = auth.uid() or es_admin_global())
  with check (subido_por = auth.uid() or es_admin_global());
create policy ba_delete on biblioteca_archivos for delete to authenticated
  using (subido_por = auth.uid() or es_admin_global());

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on
  contexto_evento, datos_historicos_marketing, ingresos, gastos,
  presupuesto_general, contactos_pipeline, decisiones_estrategicas,
  biblioteca_archivos
  to authenticated;

-- ============================================================================
-- BLOQUE F — Búsqueda global (función SECURITY INVOKER → respeta RLS del que llama)
-- ============================================================================
create or replace function buscar_global(q text)
returns table (tipo text, id uuid, titulo text, subtitulo text, ruta text)
language sql stable
as $$
  select 'tarea', t.id, t.titulo, a.nombre::text, '/panel/' || a.nombre
    from tareas t join areas a on a.id = t.area_id
    where t.titulo ilike '%' || q || '%'
  union all
  select 'ponente', p.id, p.nombre, p.tema_propuesto, '/panel/ponentes'
    from postulaciones_ponentes p where p.nombre ilike '%' || q || '%'
  union all
  select 'stand', s.id, s.codigo, s.estado::text, '/panel/stands'
    from stands s where s.codigo ilike '%' || q || '%' or coalesce(s.nombre,'') ilike '%' || q || '%'
  union all
  select 'patrocinio', pa.id, pa.empresa, pa.tier::text, '/panel/patrocinios'
    from patrocinios pa where pa.empresa ilike '%' || q || '%'
  union all
  select 'contacto', c.id, c.nombre_entidad, c.tipo::text, '/panel/' || (case c.tipo when 'alianza' then 'alianzas' else 'comunidades' end)
    from contactos_pipeline c where c.nombre_entidad ilike '%' || q || '%'
  union all
  select 'archivo', b.id, b.nombre, b.tipo::text, '/panel/biblioteca'
    from biblioteca_archivos b where b.nombre ilike '%' || q || '%' or array_to_string(b.tags, ' ') ilike '%' || q || '%'
  union all
  select 'decision', d.id, d.titulo, array_to_string(d.tags, ', '), '/panel/estrategia'
    from decisiones_estrategicas d where d.titulo ilike '%' || q || '%' or array_to_string(d.tags, ' ') ilike '%' || q || '%'
  limit 40;
$$;
