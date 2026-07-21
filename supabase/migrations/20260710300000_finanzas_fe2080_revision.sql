-- ============================================================================
-- Finanzas — marca las 2 filas duplicadas de la factura FE-2080 (MUNDO FIT
-- COLOMBIA S.A.S.) como pendientes de revisión, sin borrar ninguna.
--
-- Encontradas en movimientos_ingresos: mismo cliente, mismo concepto, mismo
-- monto ($8.996.400), timestamps de captura separados por ~17h el mismo día
-- (10 de abril de 2026) — posible duplicado de captura en el Excel origen, o
-- dos cargos reales distintos. El usuario decidió explícitamente NO borrar
-- ninguna fila hasta confirmar con el equipo/Effisystems.
-- ============================================================================

update movimientos_ingresos
set
  revision_pendiente = true,
  nota_revision = 'Posible duplicado — mismo cliente, mismo monto ($8.996.400), timestamps separados por ~17h el mismo día. Pendiente confirmar con Effisystems si es un error de captura o dos cargos reales antes de decidir si se elimina una fila.'
where numero_factura = 'FE-2080';

-- ---------- Validación: deben ser exactamente 2 filas afectadas -------------
do $$
declare
  v_count int;
begin
  select count(*) into v_count from movimientos_ingresos where numero_factura = 'FE-2080';
  if v_count <> 2 then
    raise exception 'Se esperaban exactamente 2 filas con numero_factura FE-2080, encontradas %', v_count;
  end if;
end $$;
