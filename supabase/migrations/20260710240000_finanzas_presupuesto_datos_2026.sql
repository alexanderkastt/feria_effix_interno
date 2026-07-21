-- ============================================================================
-- Finanzas (Bloque A) — carga de datos reales del presupuesto maestro 2026.
-- 77 líneas (72 egresos + 5 ingresos) extraídas y validadas directamente del
-- Excel 'Presupuesto y Proyecciónes Feria Effix 2026 V1 TODO EL RECINTO.xlsx',
-- hoja PRESUPUESTO. Totales verificados contra el archivo original:
--   Total ingresos: $6.989.186.800
--   Total egresos:  $6.967.513.115,91
--   Margen:         $21.673.684,09
-- Generado programáticamente desde los datos parseados del Excel (sin
-- transcripción manual) para evitar errores de dedo en 77 líneas de datos
-- financieros reales.
-- ============================================================================

-- ---------- Categorías (raíz, un solo nivel; "Ventas" existe una vez por
-- tipo porque agrupa tanto ingresos (venta de stands, boletería...) como un
-- egreso ('Comisiones de ventas') ----------------------------------------
insert into categorias_presupuesto (nombre, tipo, area_id) values
  ('Ventas', 'ingreso', null),
  ('Logística', 'egreso', (select id from areas where nombre = 'logistica')),
  ('Pre evento', 'egreso', null),
  ('Plaza mayor', 'egreso', null),
  ('Evento', 'egreso', null),
  ('Audiovisual', 'egreso', null),
  ('Diseño', 'egreso', (select id from areas where nombre = 'diseno')),
  ('Impuesto', 'egreso', null),
  ('Ventas', 'egreso', null),
  ('Marketing', 'egreso', (select id from areas where nombre = 'marketing')),
  ('Ponentes', 'egreso', (select id from areas where nombre = 'ponentes')),
  ('Fijos', 'egreso', null),
  ('Variables', 'egreso', null);

-- ---------- Líneas de presupuesto (edición 2026) ----------------------------
-- area_id NO se setea acá: el trigger lineas_presupuesto_sync_area_trg la
-- completa automáticamente desde categoria_id en el INSERT.
insert into lineas_presupuesto (categoria_id, concepto, valor_estimado_actual, valor_real_anio_anterior, cantidad, edicion, nivel_sensibilidad) values
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'ingreso'), 'Ventas de stands', 2328436800, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'ingreso'), 'Boletería general y VIP', 2598750000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'ingreso'), 'Boletería  Black', 1104000000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'ingreso'), 'Patrocinios', 838000000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'ingreso'), 'Otras ventas (gran formato, cinta escarapela, comisión aliados producción stand, mangos, etc.)', 120000000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Logística' and tipo = 'egreso'), 'alquiler mesas y sillas', 12852240, 10710200, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Pre evento' and tipo = 'egreso'), 'Alquiler espacio - plaza mayor (Reunión expositores)', 7137101.4, 6488274, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Alquiler espacio - plaza mayor', 1244840830, 727213879, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Espacio Público Plazoleta interamericana Alcaldía', 74800000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Vigilancia eventos', 22326876.39, 14884584.26, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Servicio internet', 27425619.112499997, 21940495.29, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Aseo eventos', 104509724.58, 69673149.72, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'BEBIDAS INAGURACION y 3 DIAS VIP', 56514800, 28257400, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Servicio alimentación (VIP cena INAUGURACIÓN)', 81000000, 58157000, 3000, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Tapa cable de 1 metro', 2535785.28, 2113154.4, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Consumo Energia Kw', 33510400, 21057764, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Consumo agua', 1367072, 683536, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Consumo de gas natural', 17981675.88, 8990837.94, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Daños de infraestructura', 3707154.6399999997, 1853577.3199999998, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Plaza mayor' and tipo = 'egreso'), 'Alimentación plaza mayor (desayunos y refri) reu proveedores y dieta black', 144597610.07999998, 19521864, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Logística' and tipo = 'egreso'), 'Material pop / Gran formato / Luna: decoración parte exterior', 218448105, 145632070, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Logística' and tipo = 'egreso'), 'Logistica ENLACE 360 .(personal/ permisos/ zona de registro/ energia/mesa sillas panel, horas extras)', 877689144.4, 641905724, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Logística' and tipo = 'egreso'), 'Pantalla Led - Sonido - produccion audiovisual livesound', 958095178.81, 806578076, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Pre evento' and tipo = 'egreso'), 'Pauta - free press human bridge', 27417500, 21505000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Pre evento' and tipo = 'egreso'), 'Catering VIP, Ultravip, Camerinos (Alirio)', 31972327.200000003, 29065752, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Contratacion equipo audiovisual - la rata', 84500000, 65000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Audiovisual' and tipo = 'egreso'), 'Servicio Edicion de videos pauta Eddison Arango', 10384000, 9440000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Audiovisual' and tipo = 'egreso'), 'Servicio Edicion de videos pauta Santiago Cifuentes', 0, 1280000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Audiovisual' and tipo = 'egreso'), 'Servicio Edicion de videos Juan Fernando Gutierrez', 0, 499000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Diseño' and tipo = 'egreso'), 'Diseñador externo Tobias', 0, 11759000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Audiovisual' and tipo = 'egreso'), 'Juan Esteban Castaño Lopez', 0, 1800000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Presentadora ponentes Melissa', 4200000, 3500000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Transporte ponentes premium e invitados especiales', 10000000, 880012, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Gasto servicio tiquetera', 22761635, 17508950, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Impresos redacol: stickers, escarapelas, cintas', 82149697.5, 54766465, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Gastos audioavisuales -ANIMACIONES Andres Tapias', 12000000, 12000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Maquilladoras(2)', 5000000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Presentadores (5) (Auxilio vestuario)', 0, 0, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Comisión embajadores', 36533171.0487395, 33211973.68067227, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Gasto en regriferios - almuerzos - parqueaderos - papeleria/ enseres - Bienestar laboral / representación', 12000000, 8000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Impuesto' and tipo = 'egreso'), 'Impuesto sayco', 103950000, 87196338, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Impuesto' and tipo = 'egreso'), 'Impuesto acinpro', 14092650.000000002, 12811500, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Impuesto' and tipo = 'egreso'), 'Impuesto hacienda 16%', 415800000, 308067456, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ventas' and tipo = 'egreso'), 'Comisiones de ventas', 34930962, 29109135, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Impuesto' and tipo = 'egreso'), 'Impuesto de timbre', 0, 3967916, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Marketing' and tipo = 'egreso'), 'Gasto pauta publicitaria  FB ADS', 999919410.7915802, 521807272, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Marketing' and tipo = 'egreso'), 'Gasto pauta publicitaria  TIK TOKADS', 20000000, 20000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Marketing' and tipo = 'egreso'), 'Gasto LINKTREE', 0, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Marketing' and tipo = 'egreso'), 'Gasto manychat', 0, 1682028, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Ponentes', 350000000, 286985855, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Apoyo Ponentes Sandra Alvarez', 19000000, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Apoyo Susana Alianzas', 10000000, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Apoyo Frijolito Dirección de Piso', 10000000, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Presentadora UGC', 1440000, 1200000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Shows de clausura', 0, 15600000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Termos', 0, 22000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Shows de inauguracion', 5520000, 4600000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Varios VIP FUEGO', 0, 53744948, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Ponentes' and tipo = 'egreso'), 'Souvenirs ponentes botellas - GRABADERIA', 21133800, 10566900, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'REDACOL: Librillo', 37500000, 25000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Imprevistos', 100000000, null, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Silletas effix + alcaldia', 3600000, 3000000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Equipo consola (Frijol)', 28542745.000000004, 25947950, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Evento' and tipo = 'egreso'), 'Tapetes prisma', 66376000, 66376000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Nómina Anual Contabilidad', 9240000, 8400000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Nómina Anual Yeniffer', 45591638.400000006, 41446944, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Agencia Juan ADS', 62000000, 48876000, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Honorarios Joaquin ADS', 36000000, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Honorarios Alejandra Comercialización Stands', 21000000, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'VIP Gastos directos de Effi', 62688502.800000004, 56989548, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Nómina Anual Estefanía', 73499247.80000001, 66817498, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Nómina Anual Manuel', 0, null, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Nómina Juan Carmona', 51808680.00000001, 47098800, null, '2026', 'personal'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), '3% de Gastos compartidos de sede', 40889217.6, 37172016, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Aportes en linea', 44275013.2, 40250012, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Fijos' and tipo = 'egreso'), 'Claro - Movil', 4752000, 4320000, null, '2026', 'resumen'),
  ((select id from categorias_presupuesto where nombre = 'Variables' and tipo = 'egreso'), 'Costos financieros (Pasarelas y retefuente)', 45705600, null, null, '2026', 'resumen');

-- ---------- Validación de totales (debe devolver 0 filas) --------------------
do $$
declare
  v_ingresos numeric;
  v_egresos numeric;
begin
  select coalesce(sum(l.valor_estimado_actual), 0) into v_ingresos from lineas_presupuesto l join categorias_presupuesto c on c.id = l.categoria_id where c.tipo = 'ingreso' and l.edicion = '2026';
  select coalesce(sum(l.valor_estimado_actual), 0) into v_egresos from lineas_presupuesto l join categorias_presupuesto c on c.id = l.categoria_id where c.tipo = 'egreso' and l.edicion = '2026';
  if abs(v_ingresos - 6989186800) > 1 then
    raise exception 'Total ingresos no cuadra: esperado 6989186800, real %', v_ingresos;
  end if;
  if abs(v_egresos - 6967513115.91282) > 1 then
    raise exception 'Total egresos no cuadra: esperado 6967513115.91282, real %', v_egresos;
  end if;
end $$;
