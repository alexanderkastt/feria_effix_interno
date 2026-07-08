-- ============================================================================
-- Habilita Supabase Realtime para las tablas del módulo de Stands, que es hoy
-- el único módulo "listo" para todo el equipo (ver `listo` en
-- src/lib/areas.ts) y donde hay uso concurrente real: varias personas pueden
-- estar viendo/editando el panel al mismo tiempo. Con esto, un cambio de
-- cualquiera se refleja en vivo para los demás sin recargar la página.
--
-- No se agrega `stands_publico` (la vista del mapa público) porque Realtime
-- por postgres_changes trabaja sobre tablas base, no vistas, y la tabla base
-- `stands` solo es legible por `authenticated` (RLS `stands_select`) — un
-- visitante anónimo del mapa público no podría suscribirse igual. Vivo en el
-- mapa público requiere el patrón de Broadcast Authorization de Supabase
-- (trigger + tabla de mensajes), que queda pendiente como mejora aparte.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stands'
  ) then
    alter publication supabase_realtime add table stands;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pagos_stand'
  ) then
    alter publication supabase_realtime add table pagos_stand;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'stands_devoluciones'
  ) then
    alter publication supabase_realtime add table stands_devoluciones;
  end if;
end $$;

-- REPLICA IDENTITY FULL: incluye los valores previos de la fila en los
-- eventos de update/delete. Hoy el panel solo usa el evento como disparador
-- para refrescar (no le importa el valor viejo), pero lo dejamos preparado
-- para poder mostrar en el futuro, por ejemplo, "quién cambió qué" en vivo
-- sin otra migración.
alter table stands replica identity full;
alter table pagos_stand replica identity full;
alter table stands_devoluciones replica identity full;
