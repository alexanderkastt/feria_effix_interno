-- ============================================================================
-- Feria Effix 2026 — Historial de cambios de stands (auditoría genérica).
-- Autor lógico: db-architect
--
-- Registra automáticamente CUALQUIER cambio de columna en `stands` (estado,
-- estado_venta, precios, cliente, checklist, fusiones, etc.) vía un trigger
-- genérico que compara old vs new fila a fila usando to_jsonb — no hay que
-- mantener una lista de columnas a mano ni tocar esta migración cada vez que
-- se agregue un campo nuevo a `stands`.
--
-- Esto también resuelve "necesito fechas de reserva/negociación/etc.": cada
-- transición de estado queda con su propio timestamp acá (creado_en), sin
-- necesidad de columnas de fecha dedicadas por hito. Ej. la fecha de reserva
-- de un stand es el creado_en de la fila donde campo='estado' y
-- valor_nuevo='reservado'.
--
-- No se registra `actualizado_en` (ruido, se actualiza en cada update por el
-- trigger touch_actualizado_en existente).
-- ============================================================================

create table stands_historial (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references stands (id) on delete cascade,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index stands_historial_stand_idx on stands_historial (stand_id, creado_en desc);

comment on table stands_historial is
  'Auditoría genérica de stands: una fila por cada columna que cambió en '
  'cada update, con quién y cuándo. Alimentada por trigger, no se escribe a '
  'mano. campo=''__creacion__'' marca el alta del stand.';

-- ---------- Trigger genérico de cambios (UPDATE) -----------------------------
create or replace function trg_stands_historial_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  k text;
  old_val text;
  new_val text;
begin
  for k in select jsonb_object_keys(to_jsonb(new)) loop
    if k = 'actualizado_en' then
      continue;
    end if;
    old_val := to_jsonb(old) ->> k;
    new_val := to_jsonb(new) ->> k;
    if old_val is distinct from new_val then
      insert into stands_historial (stand_id, campo, valor_anterior, valor_nuevo, usuario_id)
      values (new.id, k, old_val, new_val, auth.uid());
    end if;
  end loop;
  return new;
end;
$$;

create trigger stands_historial_trigger_update
  after update on stands
  for each row execute function trg_stands_historial_update();

-- ---------- Trigger de alta (INSERT) -----------------------------------------
create or replace function trg_stands_historial_insert()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into stands_historial (stand_id, campo, valor_anterior, valor_nuevo, usuario_id)
  values (new.id, '__creacion__', null, new.codigo, auth.uid());
  return new;
end;
$$;

create trigger stands_historial_trigger_insert
  after insert on stands
  for each row execute function trg_stands_historial_insert();

-- ============================================================================
-- RLS — mismo patrón que el resto del dominio stands: solo lectura para
-- quien puede ver el área 'stands'. Nadie escribe directo, solo los triggers
-- (security definer, corren con privilegios propios sin necesidad de grant
-- de insert para `authenticated`).
-- ============================================================================
alter table stands_historial enable row level security;

create policy stands_historial_select on stands_historial
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );

grant select on stands_historial to authenticated;
