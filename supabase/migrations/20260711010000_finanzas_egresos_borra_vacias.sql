-- ============================================================================
-- Finanzas — borra las filas de movimientos_egresos completamente vacías.
--
-- En el Bloque C el usuario había pedido explícitamente migrar las 617 filas
-- de la hoja "Egresos" completas, incluidas las 304 sin ningún dato real
-- (plantilla sin usar en el Excel), como registros para completar después.
-- Decisión revisada (2026-07-11): esas 304 filas no se van a completar,
-- se borran.
-- ============================================================================

delete from movimientos_egresos
where proveedor_nombre is null
  and descripcion_servicio is null
  and total_neto is null
  and fecha is null;

-- ---------- Validación: deben quedar exactamente 313 filas -------------------
do $$
declare
  v_count int;
begin
  select count(*) into v_count from movimientos_egresos;
  if v_count <> 313 then
    raise exception 'Se esperaban 313 filas en movimientos_egresos tras borrar las vacías, quedaron %', v_count;
  end if;
end $$;
