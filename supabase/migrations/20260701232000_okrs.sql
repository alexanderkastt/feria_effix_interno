-- ============================================================================
-- Feria Effix 2026 — Bloques C y E: OKRs, resultados clave y check-ins
-- ============================================================================

create type estado_okr as enum ('en_curso', 'cumplido', 'en_riesgo', 'abandonado');

create table okrs (
  id uuid primary key default gen_random_uuid(),
  area_id uuid references areas (id) on delete cascade,   -- null = transversal
  titulo_objetivo text not null,
  descripcion text,
  periodo text not null default 'Feria Effix 2026',
  responsable_id uuid references usuarios (id) on delete set null,
  estado estado_okr not null default 'en_curso',
  creado_en timestamptz not null default now()
);

create table resultados_clave (
  id uuid primary key default gen_random_uuid(),
  okr_id uuid not null references okrs (id) on delete cascade,
  descripcion text not null,
  kpi_relacionado_id uuid references kpis (id) on delete set null,
  valor_meta numeric(16, 2),
  valor_actual numeric(16, 2) default 0,
  unidad text,
  progreso_calculado numeric(6, 2) not null default 0,
  creado_en timestamptz not null default now()
);
create index rc_okr_idx on resultados_clave (okr_id);

create table checkins_okr (
  id uuid primary key default gen_random_uuid(),
  okr_id uuid not null references okrs (id) on delete cascade,
  fecha date not null default current_date,
  comentario text,
  creado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index checkins_okr_idx on checkins_okr (okr_id, fecha desc);

-- ---------- Progreso auto: refresca los RC vinculados a un KPI ---------------
create or replace function refrescar_okr_progreso()
returns void language plpgsql security definer set search_path = public as $$
begin
  update resultados_clave rc set
    valor_actual = v.valor,
    progreso_calculado = case
      when k.unidad = 'porcentaje' then least(coalesce(v.valor,0), 100)
      else least(100, 100.0 * coalesce(v.valor,0) / nullif(rc.valor_meta,0))
    end
  from kpis k
  join lateral (
    select valor from kpi_valores where kpi_id = k.id order by fecha_medicion desc limit 1
  ) v on true
  where rc.kpi_relacionado_id = k.id;

  -- Los RC sin KPI: progreso desde su valor_actual manual.
  update resultados_clave rc set
    progreso_calculado = least(100, 100.0 * coalesce(rc.valor_actual,0) / nullif(rc.valor_meta,0))
  where rc.kpi_relacionado_id is null;
end;
$$;

-- ---------- RLS -------------------------------------------------------------
alter table okrs enable row level security;
alter table resultados_clave enable row level security;
alter table checkins_okr enable row level security;

-- OKRs: los ve todo el equipo autenticado. Escriben: admin (transversales) o
-- el gestor del área del OKR.
create policy okrs_select on okrs for select to authenticated using (true);
create policy okrs_write on okrs for all to authenticated using (
  es_admin_global() or (area_id is not null and puede_editar_area(area_id))
) with check (
  es_admin_global() or (area_id is not null and puede_editar_area(area_id))
);

create policy rc_select on resultados_clave for select to authenticated using (true);
create policy rc_write on resultados_clave for all to authenticated using (
  exists (select 1 from okrs o where o.id = okr_id
          and (es_admin_global() or (o.area_id is not null and puede_editar_area(o.area_id))))
) with check (
  exists (select 1 from okrs o where o.id = okr_id
          and (es_admin_global() or (o.area_id is not null and puede_editar_area(o.area_id))))
);

create policy ci_select on checkins_okr for select to authenticated using (true);
create policy ci_write on checkins_okr for all to authenticated using (
  exists (select 1 from okrs o where o.id = okr_id
          and (es_admin_global() or (o.area_id is not null and puede_editar_area(o.area_id))))
) with check (
  exists (select 1 from okrs o where o.id = okr_id
          and (es_admin_global() or (o.area_id is not null and puede_editar_area(o.area_id))))
);

grant select, insert, update, delete on okrs, resultados_clave, checkins_okr to authenticated;

-- ---------- Semilla: OKR transversal de ejemplo (datos reales del contexto) --
do $seed$
declare v_okr uuid;
begin
  insert into okrs (area_id, titulo_objetivo, descripcion, periodo, responsable_id, estado)
  values (null, 'Hacer de Effix 2026 la edición más grande hasta ahora',
          'Objetivo transversal de toda la feria.', 'Feria Effix 2026',
          '11111111-1111-1111-1111-111111111111', 'en_curso')
  returning id into v_okr;

  insert into resultados_clave (okr_id, descripcion, valor_meta, unidad) values
    (v_okr, '60.000 asistentes en total', 60000, 'asistentes'),
    (v_okr, '540 boletas Black vendidas', 540, 'boletas');
  insert into resultados_clave (okr_id, descripcion, kpi_relacionado_id, valor_meta, unidad)
  values (v_okr, '$830M en facturación de patrocinios',
          (select id from kpis where clave='patro_pct_meta'), 830000000, 'COP');
end $seed$;

select refrescar_okr_progreso();
