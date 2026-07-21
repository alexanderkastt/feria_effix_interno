-- ============================================================================
-- Finanzas (Bloque E) — datos reales de decisiones de venue.
-- Generado programáticamente desde el Excel ya parseado y validado.
-- 'unidad_tarifa' se migra TAL CUAL viene del Excel (CD/EA/otro), sin
-- traducir su significado (decisión explícita del usuario, no hay contrato
-- disponible para confirmarlo).
--
-- Escenario 'Costeo Plaza Mayor 2026': 23 líneas de la tabla 'ARRENDAMIENTO
-- DE ÁREAS' de la hoja 'Costeo plaza mayor'. Total validado: $1.244.840.830,
-- el mismo monto ya cargado en Bloque A como línea de presupuesto
-- 'Alquiler espacio - plaza mayor' (categoría Plaza mayor).
--
-- 4 escenarios históricos/comparativos (edición '2024', año de referencia de
-- las hojas fuente): Espacio 2024 real, mismo espacio con tarifas 2024,
-- pabellones únicamente, y todo Plaza Mayor — todos con unidad_tarifa
-- ='otro' porque esas hojas no usan la notación CD/EA en absoluto.
-- ============================================================================

-- ---------- Escenario: Costeo Plaza Mayor 2026 -------------------------------
insert into escenarios_venue (nombre_escenario, edicion, total_bruto, iva, total_neto) values
  ('Costeo Plaza Mayor 2026', '2026', 1244840830, 236519757.7, 1481360587.7);

insert into espacios_venue (nombre_espacio, tarifa_unidad, unidad_tarifa, edicion) values
  ('Pabellón Verde', 17133000, 'CD', '2026'),
  ('Pabellón Azul', 14298000, 'CD', '2026'),
  ('Pabellón Blanco', 17659000, 'CD', '2026'),
  ('Pabellón Verde', 26356000, 'CD', '2026'),
  ('Pabellón Verde', 17133000, 'CD', '2026'),
  ('Pabellón Blanco', 27168000, 'CD', '2026'),
  ('Pabellón Blanco', 17659000, 'EA', '2026'),
  ('Pabellón Azul', 21997000, 'CD', '2026'),
  ('Pabellón Azul', 14298000, 'CD', '2026'),
  ('Pabellón Amarillo', 29349000, 'CD', '2026'),
  ('Pabellón Amarillo', 45151000, 'CD', '2026'),
  ('Pabellón Amarillo', 29349000, 'EA', '2026'),
  ('Gran Salón', 29465000, 'CD', '2026'),
  ('Gran Salón', 45331000, 'CD', '2026'),
  ('Gran Salón', 29465000, 'EA', '2026'),
  ('Terraza Exposiciones', 2500000, 'CD', '2026'),
  ('Pabellón Rojo', 9597000, 'CD', '2026'),
  ('Pabellón Rojo', 14765000, 'CD', '2026'),
  ('Pabellón Rojo', 9597000, 'EA', '2026'),
  ('Terraza Exposiciones', 3846000, 'CD', '2026'),
  ('Terraza Exposiciones', 2500000, 'EA', '2026'),
  ('Salón A+B', 5211010, 'otro', '2026'),
  ('Salón C+D', 5211010, 'otro', '2026');

insert into escenario_venue_espacios (escenario_id, espacio_id, unidades, subtotal) values
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 17133000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 68532000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 14298000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 57192000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 17659000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 70636000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 26356000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 79068000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 17133000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 1.5, 25699500),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 27168000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 81504000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 17659000 and unidad_tarifa = 'EA' and edicion = '2026' limit 1), 1.5, 26488500),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 21997000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 65991000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 14298000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 1.5, 21447000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 29349000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 117396000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 45151000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 135453000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 29349000 and unidad_tarifa = 'EA' and edicion = '2026' limit 1), 1.5, 44023500),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 29465000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 117860000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 45331000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 135993000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 29465000 and unidad_tarifa = 'EA' and edicion = '2026' limit 1), 1, 29465000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2500000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 10000000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 9597000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 4, 45681720),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 14765000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 52711050),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 9597000 and unidad_tarifa = 'EA' and edicion = '2026' limit 1), 1.5, 14395500),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 3846000 and unidad_tarifa = 'CD' and edicion = '2026' limit 1), 3, 11538000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2500000 and unidad_tarifa = 'EA' and edicion = '2026' limit 1), 1, 2500000),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Salón A+B' and tarifa_unidad = 5211010 and unidad_tarifa = 'otro' and edicion = '2026' limit 1), 3, 15633030),
  ((select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026'), (select id from espacios_venue where nombre_espacio = 'Salón C+D' and tarifa_unidad = 5211010 and unidad_tarifa = 'otro' and edicion = '2026' limit 1), 3, 15633030);

-- ---------- Escenario: Espacio 2024 (real) (hoja "FERIA 2024") ----------
insert into escenarios_venue (nombre_escenario, edicion, total_bruto, iva, total_neto) values
  ('Espacio 2024 (real)', '2024', 382423000, 72660370, 455083370);

insert into espacios_venue (nombre_espacio, tarifa_unidad, unidad_tarifa, edicion) values
  ('Pabellón Verde', 10198000, 'otro', '2024'),
  ('Pabellón Azul', 8290500, 'otro', '2024'),
  ('Pabellón Blanco', 10336000, 'otro', '2024'),
  ('Pabellón Verde', 20396000, 'otro', '2024'),
  ('Pabellón Verde', 10198000, 'otro', '2024'),
  ('Pabellón Blanco', 20672000, 'otro', '2024'),
  ('Pabellón Blanco', 10336000, 'otro', '2024'),
  ('Pabellón Azul', 16581000, 'otro', '2024'),
  ('Pabellón Azul', 8290500, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Terraza Exposiciones', 2977000, 'otro', '2024'),
  ('Terraza Exposiciones', 1488500, 'otro', '2024'),
  ('Terraza Exposiciones', 1488500, 'otro', '2024'),
  ('Salón de Conferencias A + B', 3433000, 'otro', '2024'),
  ('Salón de Conferencias C + C', 3433000, 'otro', '2024'),
  ('Pabellón Rojo', 5869500, 'otro', '2024'),
  ('Pabellón Rojo', 11739000, 'otro', '2024'),
  ('Pabellón Rojo', 5869500, 'otro', '2024');

insert into escenario_venue_espacios (escenario_id, espacio_id, unidades, subtotal) values
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 10198000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 30594000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 8290500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 24871500),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 10336000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 31008000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 20396000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 61188000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 10198000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 10198000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 20672000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 62016000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 10336000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 10336000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 16581000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 49743000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 8290500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 8290500),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 2, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2977000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 8931000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 1488500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 4465500),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 1488500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 1488500),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias A + B' and tarifa_unidad = 3433000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 10299000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias C + C' and tarifa_unidad = 3433000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 10299000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 5869500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 17608500),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 11739000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 35217000),
  ((select id from escenarios_venue where nombre_escenario = 'Espacio 2024 (real)'), (select id from espacios_venue where nombre_espacio = 'Pabellón Rojo' and tarifa_unidad = 5869500 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 5869500);

-- ---------- Escenario: Mismo espacio, tarifas 2024 (hoja "Mismo espacio 2024") ----------
insert into escenarios_venue (nombre_escenario, edicion, total_bruto, iva, total_neto) values
  ('Mismo espacio, tarifas 2024', '2024', 439573000, 83518870, 523091870);

insert into espacios_venue (nombre_espacio, tarifa_unidad, unidad_tarifa, edicion) values
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Verde', 24609000, 'otro', '2024'),
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Blanco', 25367000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Azul', 20539000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Pabellón Amarillo', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Terraza Exposiciones', 3591000, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Salón de Conferencias A + B', 4089000, 'otro', '2024'),
  ('Salón de Conferencias C + C', 4104000, 'otro', '2024');

insert into escenario_venue_espacios (escenario_id, espacio_id, unidades, subtotal) values
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 47991000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 40050000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 49464000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 24609000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 73827000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 15997000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 25367000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 76101000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 16488000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 20539000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 61617000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 13350000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 2, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 7002000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 3591000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 10773000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 2334000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias A + B' and tarifa_unidad = 4089000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12267000),
  ((select id from escenarios_venue where nombre_escenario = 'Mismo espacio, tarifas 2024'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias C + C' and tarifa_unidad = 4104000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12312000);

-- ---------- Escenario: Pabellones únicamente (hoja "Espacio pabellones") ----------
insert into escenarios_venue (nombre_escenario, edicion, total_bruto, iva, total_neto) values
  ('Pabellones únicamente', '2024', 675659000, 128375210, 804034210);

insert into espacios_venue (nombre_espacio, tarifa_unidad, unidad_tarifa, edicion) values
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Verde', 24609000, 'otro', '2024'),
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Blanco', 25367000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Azul', 20539000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Amarillo', 27403000, 'otro', '2024'),
  ('Pabellón Amarillo', 42158000, 'otro', '2024'),
  ('Pabellón Amarillo', 27403000, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Gran Salón', 0, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Terraza Exposiciones', 3591000, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Salón de Conferencias A + B', 4089000, 'otro', '2024'),
  ('Salón de Conferencias C + C', 4104000, 'otro', '2024');

insert into escenario_venue_espacios (escenario_id, espacio_id, unidades, subtotal) values
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 47991000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 40050000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 49464000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 24609000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 73827000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 15997000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 25367000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 76101000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 16488000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 20539000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 61617000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 13350000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 27403000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 82209000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 42158000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 126474000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 27403000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 27403000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 2, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 0 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 0),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 7002000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 3591000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 10773000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 2334000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias A + B' and tarifa_unidad = 4089000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12267000),
  ((select id from escenarios_venue where nombre_escenario = 'Pabellones únicamente'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias C + C' and tarifa_unidad = 4104000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12312000);

-- ---------- Escenario: Todo Plaza Mayor (hoja "Espacio todo plaza mayor") ----------
insert into escenarios_venue (nombre_escenario, edicion, total_bruto, iva, total_neto) values
  ('Todo Plaza Mayor', '2024', 885173000, 168182870, 1053355870);

insert into espacios_venue (nombre_espacio, tarifa_unidad, unidad_tarifa, edicion) values
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Verde', 24609000, 'otro', '2024'),
  ('Pabellón Verde', 15997000, 'otro', '2024'),
  ('Pabellón Blanco', 25367000, 'otro', '2024'),
  ('Pabellón Blanco', 16488000, 'otro', '2024'),
  ('Pabellón Azul', 20539000, 'otro', '2024'),
  ('Pabellón Azul', 13350000, 'otro', '2024'),
  ('Pabellón Amarillo', 27403000, 'otro', '2024'),
  ('Pabellón Amarillo', 42158000, 'otro', '2024'),
  ('Pabellón Amarillo', 27403000, 'otro', '2024'),
  ('Gran Salón', 27512000, 'otro', '2024'),
  ('Gran Salón', 42326000, 'otro', '2024'),
  ('Gran Salón', 27512000, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Terraza Exposiciones', 3591000, 'otro', '2024'),
  ('Terraza Exposiciones', 2334000, 'otro', '2024'),
  ('Salón de Conferencias A + B', 4089000, 'otro', '2024'),
  ('Salón de Conferencias C + C', 4104000, 'otro', '2024');

insert into escenario_venue_espacios (escenario_id, espacio_id, unidades, subtotal) values
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 47991000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 40050000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 49464000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 24609000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 73827000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Verde' and tarifa_unidad = 15997000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 15997000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 25367000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 76101000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Blanco' and tarifa_unidad = 16488000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 16488000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 20539000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 61617000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Azul' and tarifa_unidad = 13350000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 13350000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 27403000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 82209000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 42158000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 126474000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Pabellón Amarillo' and tarifa_unidad = 27403000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 27403000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 27512000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 2, 55024000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 42326000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 126978000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Gran Salón' and tarifa_unidad = 27512000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 27512000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 7002000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 3591000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 10773000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Terraza Exposiciones' and tarifa_unidad = 2334000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 1, 2334000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias A + B' and tarifa_unidad = 4089000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12267000),
  ((select id from escenarios_venue where nombre_escenario = 'Todo Plaza Mayor'), (select id from espacios_venue where nombre_espacio = 'Salón de Conferencias C + C' and tarifa_unidad = 4104000 and unidad_tarifa = 'otro' and edicion = '2024' limit 1), 3, 12312000);

-- ---------- Validación de totales --------------------------------------------
do $$
declare
  v_costeo numeric;
begin
  select coalesce(sum(subtotal), 0) into v_costeo from escenario_venue_espacios where escenario_id = (select id from escenarios_venue where nombre_escenario = 'Costeo Plaza Mayor 2026');
  if abs(v_costeo - 1244840830) > 1 then
    raise exception 'Total Costeo Plaza Mayor 2026 no cuadra: esperado 1244840830, real %', v_costeo;
  end if;
end $$;
