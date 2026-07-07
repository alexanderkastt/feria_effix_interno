-- ============================================================================
-- Feria Effix 2026 — Bloque B: KPIs (definición + motor de cálculo automático)
-- ============================================================================

create type unidad_kpi as enum ('numero', 'porcentaje', 'moneda', 'dias');
create type tipo_calculo_kpi as enum ('automatico', 'manual');
create type periodo_kpi as enum ('diario', 'semanal', 'mensual', 'por_evento');
create type fuente_kpi as enum ('calculado_automatico', 'ingresado_manual');

create table kpis (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references areas (id) on delete cascade,
  clave text unique,                    -- id estable para el motor de cálculo
  nombre text not null,
  descripcion text,
  unidad unidad_kpi not null default 'numero',
  tipo_calculo tipo_calculo_kpi not null default 'automatico',
  formula_automatica text,
  meta numeric(14, 2),
  periodo periodo_kpi not null default 'semanal',
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

create table kpi_valores (
  id uuid primary key default gen_random_uuid(),
  kpi_id uuid not null references kpis (id) on delete cascade,
  valor numeric(14, 2),
  fecha_medicion timestamptz not null default now(),
  fuente fuente_kpi not null default 'calculado_automatico',
  ingresado_por uuid references usuarios (id) on delete set null
);
create index kpi_valores_idx on kpi_valores (kpi_id, fecha_medicion desc);

-- ---------- RLS -------------------------------------------------------------
alter table kpis enable row level security;
alter table kpi_valores enable row level security;

-- KPIs: visibles si son transversales (area_id null), o si podés ver su área, o admin.
create policy kpis_select on kpis for select to authenticated using (
  es_admin_global() or area_id is null or puede_ver_area(area_id)
);
create policy kpis_admin on kpis for all to authenticated
  using (es_admin_global()) with check (es_admin_global());

create policy kpiv_select on kpi_valores for select to authenticated using (
  exists (select 1 from kpis k where k.id = kpi_id
          and (es_admin_global() or k.area_id is null or puede_ver_area(k.area_id)))
);
-- Carga MANUAL de valores por quien edita el área del KPI (el motor usa security definer).
create policy kpiv_insert on kpi_valores for insert to authenticated with check (
  exists (select 1 from kpis k where k.id = kpi_id
          and (es_admin_global() or (k.area_id is not null and puede_editar_area(k.area_id))))
);

grant select, insert, update, delete on kpis, kpi_valores to authenticated;

-- ============================================================================
-- Definición de KPIs iniciales (por área). clave = id estable para el motor.
-- ============================================================================
insert into kpis (area_id, clave, nombre, unidad, tipo_calculo, formula_automatica, meta, periodo) values
  ((select id from areas where nombre='stands'), 'stands_pct_vendidos', '% de stands vendidos', 'porcentaje', 'automatico', 'stands vendidos / total stands', 70, 'semanal'),
  ((select id from areas where nombre='stands'), 'stands_ticket_promedio', 'Ticket promedio por stand vendido', 'moneda', 'automatico', 'avg(precio) de stands vendidos', 6000000, 'mensual'),
  ((select id from areas where nombre='patrocinios'), 'patro_pct_meta', '% de facturación de patrocinios', 'porcentaje', 'automatico', 'monto pagado / monto comprometido', 100, 'semanal'),
  ((select id from areas where nombre='patrocinios'), 'patro_total', 'Patrocinios cerrados', 'numero', 'automatico', 'count(patrocinios)', 10, 'mensual'),
  ((select id from areas where nombre='ponentes'), 'ponentes_postulaciones', 'Postulaciones recibidas', 'numero', 'automatico', 'count(postulaciones_ponentes)', 50, 'semanal'),
  ((select id from areas where nombre='ponentes'), 'ponentes_pct_aceptacion', '% de aceptación de ponentes', 'porcentaje', 'automatico', 'aceptados / total', 40, 'mensual'),
  ((select id from areas where nombre='marketing'), 'email_tasa_apertura', 'Tasa de apertura de email', 'porcentaje', 'automatico', 'aperturas / entregados', 25, 'semanal'),
  ((select id from areas where nombre='finanzas'), 'fin_balance_neto', 'Balance neto', 'moneda', 'automatico', 'ingresos (confirmado+cobrado) - gastos pagados', 0, 'semanal'),
  ((select id from areas where nombre='finanzas'), 'fin_pct_presupuesto', '% de presupuesto ejecutado', 'porcentaje', 'automatico', 'gastos pagados / presupuesto total', 100, 'mensual'),
  ((select id from areas where nombre='produccion'), 'prod_pct_completados', '% de ítems completados', 'porcentaje', 'automatico', 'completados / total', 100, 'semanal'),
  ((select id from areas where nombre='diseno'), 'diseno_urgentes', 'Solicitudes urgentes sin resolver', 'numero', 'automatico', 'urgentes no entregadas', 0, 'semanal'),
  ((select id from areas where nombre='alianzas'), 'alianzas_pct_cerrado', '% de alianzas cerradas', 'porcentaje', 'automatico', 'cerradas / total alianzas', 50, 'mensual')
on conflict (clave) do nothing;

-- ============================================================================
-- Motor de cálculo (kpi-engine): recalcula los KPIs automáticos. Robusto a tablas vacías.
-- ============================================================================
create or replace function _kpi_set(p_clave text, p_valor numeric)
returns void language sql security definer set search_path = public as $$
  insert into kpi_valores (kpi_id, valor, fuente)
  select id, coalesce(p_valor, 0), 'calculado_automatico'
  from kpis where clave = p_clave and activo and tipo_calculo = 'automatico';
$$;

create or replace function recalcular_kpis()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- Stands
  perform _kpi_set('stands_pct_vendidos',
    (select 100.0 * count(*) filter (where estado='vendido') / nullif(count(*),0) from stands));
  perform _kpi_set('stands_ticket_promedio',
    (select avg(precio) from stands where estado='vendido'));
  -- Patrocinios
  perform _kpi_set('patro_pct_meta',
    (select 100.0 * sum(monto) filter (where estado_pago='pagado') / nullif(sum(monto),0) from patrocinios));
  perform _kpi_set('patro_total', (select count(*) from patrocinios));
  -- Ponentes
  perform _kpi_set('ponentes_postulaciones', (select count(*) from postulaciones_ponentes));
  perform _kpi_set('ponentes_pct_aceptacion',
    (select 100.0 * count(*) filter (where estado='aceptado') / nullif(count(*),0) from postulaciones_ponentes));
  -- Marketing (email)
  perform _kpi_set('email_tasa_apertura',
    (select 100.0 * count(*) filter (where estado in ('abierto','click'))
       / nullif(count(*) filter (where estado in ('entregado','abierto','click')),0) from envios_email));
  -- Finanzas
  perform _kpi_set('fin_balance_neto',
    (select coalesce((select sum(monto) from ingresos where estado in ('confirmado','cobrado')),0)
          - coalesce((select sum(monto) from gastos where estado='pagado'),0)));
  perform _kpi_set('fin_pct_presupuesto',
    (select 100.0 * coalesce((select sum(monto) from gastos where estado='pagado'),0)
       / nullif((select sum(monto_asignado) from presupuesto_general),0)));
  -- Producción
  perform _kpi_set('prod_pct_completados',
    (select 100.0 * count(*) filter (where etapa='completado') / nullif(count(*),0) from items_produccion));
  -- Diseño
  perform _kpi_set('diseno_urgentes',
    (select count(*) from solicitudes_diseno where prioridad='urgente' and etapa <> 'entregado'));
  -- Alianzas
  perform _kpi_set('alianzas_pct_cerrado',
    (select 100.0 * count(*) filter (where etapa='cerrado') / nullif(count(*),0)
       from contactos_pipeline where tipo='alianza'));
end;
$$;

-- Primera corrida para poblar valores iniciales.
select recalcular_kpis();
