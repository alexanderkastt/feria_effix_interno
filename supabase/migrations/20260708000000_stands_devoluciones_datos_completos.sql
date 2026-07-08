-- ============================================================================
-- Completa `stands_devoluciones` con las columnas de la hoja "Devoluciones"
-- del Excel que nunca se habían importado (solo existían pabellon/codigo/
-- valor_pagado_hasta_devolucion/estado_devolucion/motivo/observaciones).
--
-- Por qué hacía falta: el panel mostraba el nombre del cliente haciendo un
-- JOIN en vivo a `stands` por stand_id. Eso rompe la foto histórica de la
-- devolución apenas el stand cambia de estado: de los 11 stands devueltos,
-- 9 ya volvieron a "disponible" (se liberaron, lo que borra nombre/cliente
-- de `stands`) y 1 (AM58) se revendió a otro cliente distinto — el join
-- mostraba el nombre del cliente NUEVO, no el que realmente desistió. Una
-- devolución necesita su propia fotografía de los datos comerciales al
-- momento de desistir, independiente de lo que pase después con el stand.
-- ============================================================================

alter table stands_devoluciones add column if not exists medida text;
alter table stands_devoluciones add column if not exists valor_sin_iva numeric(14, 2);
alter table stands_devoluciones add column if not exists valor_con_iva numeric(14, 2);
alter table stands_devoluciones add column if not exists precio_venta numeric(14, 2);
alter table stands_devoluciones add column if not exists nombre_comercial text;
alter table stands_devoluciones add column if not exists nombre_fiscal text;
alter table stands_devoluciones add column if not exists nombre_persona_encargada text;
alter table stands_devoluciones add column if not exists numero_contacto text;
alter table stands_devoluciones add column if not exists id_effi text;
alter table stands_devoluciones add column if not exists ciudad text;
alter table stands_devoluciones add column if not exists medio_pago_primer_abono medio_pago_enum;
alter table stands_devoluciones add column if not exists forma_pago_restante forma_pago_restante_enum;

comment on column stands_devoluciones.nombre_comercial is
  'Nombre comercial del cliente AL MOMENTO de la devolución (hoja '
  'Devoluciones del Excel). No se deriva de stands.nombre: si el stand se '
  'libera o se revende después, ese dato deja de reflejar quién realmente '
  'desistió.';
comment on column stands_devoluciones.precio_venta is
  '"PRECIO DE VENTA" de la hoja Devoluciones. Idéntico a la columna "TOTAL" '
  'del Excel en los 11 registros reales, por eso no se agregó una columna '
  '"total" separada. "VALOR RESTANTE" tampoco se guarda: se calcula como '
  'precio_venta - valor_pagado_hasta_devolucion (se verificó que coincide '
  'exacto en los 11 registros).';

-- ---------- Backfill de las 11 devoluciones reales (hoja "Devoluciones") ----
update stands_devoluciones set
  medida = '3x2', valor_sin_iva = 4200000, valor_con_iva = 4998000, precio_venta = 3998400,
  nombre_comercial = 'ETIMARCAS', nombre_fiscal = 'AGUIRRE VARGAS GLADYS INES',
  nombre_persona_encargada = 'Juan Pablo Londoño', numero_contacto = '57 315 9253473',
  ciudad = 'MEDELLIN', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'ya_pago_totalidad'
where codigo = 'R 46';

update stands_devoluciones set
  medida = '6x4', valor_sin_iva = 16800000, valor_con_iva = 19992000, precio_venta = 19992000,
  nombre_comercial = 'USACO', nombre_fiscal = 'USA CO COLOMBIAN WORLDWIDE COURIER SAS',
  nombre_persona_encargada = 'Camila Usa co', ciudad = 'BOGOTA',
  medio_pago_primer_abono = 'cuenta_banco_effix', forma_pago_restante = 'mensual_directo'
where codigo = 'BL 20';

update stands_devoluciones set
  medida = '6x4', valor_sin_iva = 16800000, valor_con_iva = 19992000, precio_venta = 19992000,
  nombre_comercial = 'ALIVIO', nombre_fiscal = 'GRUPO GENESYS SAS BIC',
  nombre_persona_encargada = 'Camila Urrego', numero_contacto = '3168783296',
  ciudad = 'BOGOTA', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'AM58';

update stands_devoluciones set
  medida = '6x2', valor_sin_iva = 8400000, valor_con_iva = 9996000, precio_venta = 9996000,
  nombre_comercial = 'ALEJAECOM + CORALCOACH', nombre_fiscal = 'ALEJAECOM SAS',
  nombre_persona_encargada = 'Alejandra Ramírez', numero_contacto = '3163163070',
  ciudad = 'CALI', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'A 06';

update stands_devoluciones set
  medida = '9x3', valor_sin_iva = 18900000, valor_con_iva = 22491000, precio_venta = 19900000,
  nombre_comercial = 'LEOCONTRATIEMPO', nombre_fiscal = 'FRANCO RAMIREZ LEONARDO',
  nombre_persona_encargada = 'Leonardo Franco', ciudad = 'BOGOTA',
  medio_pago_primer_abono = 'cuenta_banco_effix', forma_pago_restante = 'mensual_directo'
where codigo = 'A 58';

update stands_devoluciones set
  medida = '4x3', valor_sin_iva = 8400000, valor_con_iva = 9996000, precio_venta = 8996400,
  nombre_comercial = 'COMERCIALIZADORA SUKI', nombre_fiscal = 'COMERCIALIZADORA SUKI S.A.S',
  nombre_persona_encargada = 'Juan Pablo Gonzalez', numero_contacto = '3127477627',
  id_effi = '12897', ciudad = 'MEDELLIN', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'A 01';

update stands_devoluciones set
  medida = '4x3', valor_sin_iva = 8400000, valor_con_iva = 9996000, precio_venta = 8996400,
  nombre_comercial = 'BOGOPACK', nombre_fiscal = 'BOGOPACK SAS',
  nombre_persona_encargada = 'Camilo Rojas', ciudad = 'BOGOTA',
  medio_pago_primer_abono = 'cuenta_banco_effix', forma_pago_restante = 'mensual_directo'
where codigo = 'A 45';

update stands_devoluciones set
  medida = '3x2', valor_sin_iva = 4200000, valor_con_iva = 4998000, precio_venta = 4498200,
  nombre_comercial = 'GLOBAL CENTER BPO', nombre_fiscal = 'GLOBAL CENTER BPO SAS',
  nombre_persona_encargada = 'Juan Carlos Álvarez', ciudad = 'MEDELLIN',
  medio_pago_primer_abono = 'cuenta_banco_effix', forma_pago_restante = 'mensual_directo'
where codigo = 'AM05';

update stands_devoluciones set
  medida = '6x4', valor_sin_iva = 16800000, valor_con_iva = 19992000, precio_venta = 19992000,
  nombre_comercial = 'ZZ LOGISTICA', nombre_fiscal = 'PERFUMERIA EZZENCIA SAS',
  nombre_persona_encargada = 'Lorena Ortiz', numero_contacto = '3219003152',
  ciudad = 'BOGOTA', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'BL 13';

update stands_devoluciones set
  medida = '6x4', valor_sin_iva = 16800000, valor_con_iva = 19992000, precio_venta = 19992000,
  nombre_comercial = 'BS ECOMM', nombre_fiscal = 'BLACK SWANS SAS',
  nombre_persona_encargada = 'Jheudy Guaza', numero_contacto = '3044546054',
  ciudad = 'BOGOTA', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'AM56';

update stands_devoluciones set
  medida = '4x2', valor_sin_iva = 5600000, valor_con_iva = 6664000, precio_venta = 6664000,
  nombre_comercial = 'EFIPAY COLOMBIA', nombre_fiscal = 'SMART PAYMENTS SAS',
  nombre_persona_encargada = 'Margarita Ariño', numero_contacto = '3153453837',
  ciudad = 'BOGOTA', medio_pago_primer_abono = 'cuenta_banco_effix',
  forma_pago_restante = 'mensual_directo'
where codigo = 'BL 47';
