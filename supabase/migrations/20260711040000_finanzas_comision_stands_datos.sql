-- ============================================================================
-- Finanzas (Bloque D) — datos reales de los 3 escenarios de comisiones
-- comerciales, extraídos de la hoja "Comisiones com. Stands" del Excel.
--
-- valor_comision NO se inserta (es columna generada: valor_base * tasa_comision).
-- ============================================================================

insert into escenarios_comision (nombre, descripcion, edicion) values
  ('Escenario Positivo', null, '2026'),
  ('Escenario Conservador', 'Que se renueve el 50% de lo que falta y el resto sea venta nueva', '2026'),
  ('Escenario Pesimista', 'Que se recupere solo el 25% de los del 2025', '2026');

insert into comision_items (escenario_id, concepto, valor_base, tasa_comision) values
  -- Escenario Positivo
  ((select id from escenarios_comision where nombre = 'Escenario Positivo'), 'falta_por_vender', 1907911538, null),
  ((select id from escenarios_comision where nombre = 'Escenario Positivo'), 'falta_por_renovar', 943958347.58, 0.02),
  ((select id from escenarios_comision where nombre = 'Escenario Positivo'), 'ventas_nuevas', 963953190.42, 0.05),
  -- Escenario Conservador
  ((select id from escenarios_comision where nombre = 'Escenario Conservador'), 'falta_por_vender', 1907911538, null),
  ((select id from escenarios_comision where nombre = 'Escenario Conservador'), 'falta_por_renovar', 471979173.79, 0.02),
  ((select id from escenarios_comision where nombre = 'Escenario Conservador'), 'ventas_nuevas', 1435932364.21, 0.05),
  -- Escenario Pesimista
  ((select id from escenarios_comision where nombre = 'Escenario Pesimista'), 'falta_por_vender', 1907911538, null),
  ((select id from escenarios_comision where nombre = 'Escenario Pesimista'), 'falta_por_renovar', 235989586.90, 0.02),
  ((select id from escenarios_comision where nombre = 'Escenario Pesimista'), 'ventas_nuevas', 1671921951.11, 0.05);

-- ---------- Validación de totales (tolerancia por redondeo de centavos) -----
do $$
declare
  v_positivo numeric;
  v_conservador numeric;
  v_pesimista numeric;
begin
  select coalesce(sum(valor_comision), 0) into v_positivo
    from comision_items where escenario_id = (select id from escenarios_comision where nombre = 'Escenario Positivo');
  select coalesce(sum(valor_comision), 0) into v_conservador
    from comision_items where escenario_id = (select id from escenarios_comision where nombre = 'Escenario Conservador');
  select coalesce(sum(valor_comision), 0) into v_pesimista
    from comision_items where escenario_id = (select id from escenarios_comision where nombre = 'Escenario Pesimista');

  if abs(v_positivo - 67076826.47) > 1 then
    raise exception 'Comisión total Escenario Positivo no cuadra: esperado 67076826.47, real %', v_positivo;
  end if;
  if abs(v_conservador - 81236201.69) > 1 then
    raise exception 'Comisión total Escenario Conservador no cuadra: esperado 81236201.69, real %', v_conservador;
  end if;
  if abs(v_pesimista - 88315889.29) > 1 then
    raise exception 'Comisión total Escenario Pesimista no cuadra: esperado 88315889.29, real %', v_pesimista;
  end if;
end $$;
