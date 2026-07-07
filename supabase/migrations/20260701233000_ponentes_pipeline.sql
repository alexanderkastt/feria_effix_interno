-- ============================================================================
-- Feria Effix 2026 — Ponentes: de bandeja a PIPELINE completo
-- + campos de perfil completo del ponente. (No rompe automatizaciones/KPI:
--   'aceptado' se conserva; solo se agregan etapas y campos.)
-- ============================================================================

-- Etapas de pipeline (se suman a las existentes pendiente_revision/aceptado/
-- rechazado/mas_info). Para poder mapear prospectos y confirmar/agendar.
alter type estado_postulacion add value if not exists 'prospecto';
alter type estado_postulacion add value if not exists 'contactado';
alter type estado_postulacion add value if not exists 'confirmado';
alter type estado_postulacion add value if not exists 'agendado';

-- Perfil completo del ponente
alter table postulaciones_ponentes add column if not exists bio text;
alter table postulaciones_ponentes add column if not exists foto_url text;
alter table postulaciones_ponentes add column if not exists cargo text;
alter table postulaciones_ponentes add column if not exists empresa text;
alter table postulaciones_ponentes add column if not exists ciudad_pais text;
alter table postulaciones_ponentes add column if not exists notas_internas text;
alter table postulaciones_ponentes add column if not exists responsable_id uuid references usuarios (id) on delete set null;
alter table postulaciones_ponentes add column if not exists origen text;  -- 'formulario_publico' | 'manual'
alter table postulaciones_ponentes add column if not exists actualizado_en timestamptz not null default now();

create trigger pp_touch before update on postulaciones_ponentes
  for each row execute function touch_actualizado_en();

-- Alta MANUAL de ponentes por el equipo del área (cualquier etapa),
-- además del INSERT público (que sigue limitado a estado='pendiente_revision').
create policy postulaciones_insert_interno on postulaciones_ponentes
  for insert to authenticated
  with check (puede_editar_area((select id from areas where nombre = 'ponentes')));
