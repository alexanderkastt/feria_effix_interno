-- ============================================================================
-- Semilla LOCAL de Feria Effix 2026 (solo desarrollo con Docker).
-- Crea el usuario directivo (acceso a TODO) con contraseña genérica
-- e inserta tareas de ejemplo. NO usar en producción.
-- ============================================================================

-- Usuario directivo con login por email + contraseña.
-- Contraseña genérica: FeriaEffix2026*   (cambiála luego)
-- Nota: las columnas de token deben ir como '' (string vacío), NO NULL,
-- o GoTrue falla el login con "Database error querying schema".
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token,
  reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'jacsolucionesgraficas@gmail.com',
  extensions.crypt('FeriaEffix2026*', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"nombre":"Alexander Cast"}',
  '', '', '', '', '', '', '', ''
);

-- Identidad de email (requerida por GoTrue para login con contraseña).
insert into auth.identities (
  provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"jacsolucionesgraficas@gmail.com"}',
  'email', now(), now(), now()
);

-- El trigger on_auth_user_created ya creó su fila en `usuarios`.
-- Lo promovemos a directivo (acceso total vía es_admin_global()).
update usuarios
set rol_base = 'directivo', nombre = 'Alexander Cast'
where email = 'jacsolucionesgraficas@gmail.com';

-- Tareas de ejemplo para ver el panel con datos reales.
insert into tareas (area_id, titulo, estado, prioridad, responsable_id)
select
  a.id, d.titulo, d.estado::estado_tarea, d.prioridad::prioridad,
  '11111111-1111-1111-1111-111111111111'
from (values
  ('ponentes',    'Definir shortlist de keynotes',        'en_proceso', 'alta'),
  ('ponentes',    'Cerrar guion de conversatorio IA',     'pendiente',  'media'),
  ('ponentes',    'Confirmar ponente de neuromarketing',  'bloqueado',  'alta'),
  ('stands',      'Actualizar plano comercial Plaza Mayor','en_proceso', 'alta'),
  ('stands',      'Cotizar mobiliario stands premium',    'pendiente',  'media'),
  ('logistica',   'Dossier técnico audio/pantalla',       'en_proceso', 'alta'),
  ('logistica',   'Reservar transporte de equipos',       'pendiente',  'media'),
  ('patrocinios', 'Propuesta tier Platino a marca ancla', 'en_proceso', 'alta'),
  ('patrocinios', 'Entregables pendientes patrocinador Oro','bloqueado','media')
) as d(area, titulo, estado, prioridad)
join areas a on a.nombre = d.area::area_nombre;

-- Patrocinios de ejemplo
insert into patrocinios (id, empresa, tier, monto, estado_pago, entregables_pendientes) values
  ('22222222-2222-2222-2222-222222222221', 'Envia', 'platino', 45000000, 'pagado', 'Logo en tarima principal'),
  ('22222222-2222-2222-2222-222222222222', 'Shopify LATAM', 'diamante', 30000000, 'parcial', 'Stand premium + charla'),
  ('22222222-2222-2222-2222-222222222223', 'Wompi', 'oro', 15000000, 'pendiente', 'Menciones en redes');

-- Stands de ejemplo (coinciden con los códigos del mapa)
insert into stands (codigo, nombre, tamano, precio, estado, patrocinador_id) values
  ('A-01', 'Esquina principal', '3x3', 8000000, 'vendido', '22222222-2222-2222-2222-222222222221'),
  ('A-02', 'Frente a tarima',   '3x3', 7000000, 'reservado', null),
  ('A-03', 'Pasillo central',   '3x3', 6000000, 'disponible', null),
  ('A-04', 'Pasillo central',   '3x3', 6000000, 'disponible', null),
  ('B-01', 'Zona food',         '3x3', 6500000, 'vendido', '22222222-2222-2222-2222-222222222222'),
  ('B-02', 'Zona food',         '3x3', 6000000, 'disponible', null),
  ('B-03', 'Zona demo',         '3x3', 6000000, 'reservado', null),
  ('B-04', 'Zona demo',         '3x3', 6000000, 'disponible', null),
  ('C-01', 'Entrada',           '2x2', 4500000, 'disponible', null),
  ('C-02', 'Entrada',           '2x2', 4500000, 'vendido', '22222222-2222-2222-2222-222222222223'),
  ('C-03', 'Zona networking',   '2x2', 4000000, 'disponible', null),
  ('C-04', 'Zona networking',   '2x2', 4000000, 'reservado', null);

-- Vincular el stand vendido de vuelta al patrocinador (relación bidireccional)
update patrocinios set stand_id = (select id from stands where codigo = 'A-01')
  where id = '22222222-2222-2222-2222-222222222221';
update patrocinios set stand_id = (select id from stands where codigo = 'B-01')
  where id = '22222222-2222-2222-2222-222222222222';
update patrocinios set stand_id = (select id from stands where codigo = 'C-02')
  where id = '22222222-2222-2222-2222-222222222223';

-- ---------- v2: contexto del evento (DATOS REALES de feriaeffix.com) --------
insert into contexto_evento (edicion, fecha_inicio, fecha_fin, ubicacion, meta_asistencia, precio_boleta, notas)
values ('2026', '2026-10-15', '2026-10-19', 'Plaza Mayor, Medellín', 5000, 1155000,
  'VIP y Black: 15-19 oct - General: 16-18 oct 2026. Precios: VIP $1.155.000 COP, Black USD 997 (General/Pasaporte pendientes). Organizador: EFFIX S.A.S. Contacto: gerencia@feriaeffix.com, WhatsApp 573227128649. meta_asistencia es estimada.');

-- Ponentes confirmados reales (tomados de feriaeffix.com/ponentes)
insert into postulaciones_ponentes (nombre, tema_propuesto, formato_participacion, estado) values
 ('Víctor Heras','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Xavi Esqueriguela','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Fau Kassen','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('José Lepage','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Manuela Aduanera','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Santiago Sánchez','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Pamela Richter','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Juan ID','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Javier García (Mundo Amazon)','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Felipe Vergara','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Ana Pierr','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Alejandra Rincón','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Santos Lever','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Santiago Naranjo','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Oscar Martán','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Mike Munzvil','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('El Profe Miguel','Ponente confirmado (tema por definir)','ponencia_general','aceptado'),
 ('Guillermo González Pimiento','Ponente confirmado (tema por definir)','ponencia_general','aceptado');

-- ---------- v2: finanzas -----------------------------------------------------
insert into presupuesto_general (categoria, monto_asignado) values
  ('produccion', 120000000), ('logistica', 80000000), ('marketing', 100000000),
  ('talento', 60000000), ('tecnologia', 40000000);

insert into ingresos (fuente, concepto, monto, estado) values
  ('boleteria', 'Preventa boletas early bird', 90000000, 'confirmado'),
  ('boleteria', 'Proyección venta general', 250000000, 'proyectado'),
  ('otros', 'Activación de marca aliada', 15000000, 'cobrado');

insert into gastos (categoria, concepto, monto, proveedor, estado, area_id, creado_por)
select 'logistica', 'Alquiler tarima principal', 25000000, 'Eventos Pro', 'presupuestado',
  (select id from areas where nombre = 'logistica'), '11111111-1111-1111-1111-111111111111';
insert into gastos (categoria, concepto, monto, proveedor, estado, area_id, creado_por, aprobado_por)
select 'marketing', 'Pauta digital pre-evento', 40000000, 'Meta Ads', 'aprobado',
  (select id from areas where nombre = 'marketing'),
  '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111';

-- ---------- v2: pipelines (alianzas / comunidades) ---------------------------
insert into contactos_pipeline (tipo, nombre_entidad, tipo_entidad, etapa, pais, responsable_id, codigo_descuento)
values
  ('alianza', 'Cámara de Comercio de Medellín', 'Cámara de Comercio', 'negociacion', 'Colombia', '11111111-1111-1111-1111-111111111111', null),
  ('alianza', 'Alcaldía de Medellín', 'Gobierno', 'propuesta_enviada', 'Colombia', '11111111-1111-1111-1111-111111111111', null),
  ('comunidad', 'Comunidad Ecom México', 'Comunidad internacional', 'contactado', 'México', '11111111-1111-1111-1111-111111111111', 'EFXMX20'),
  ('comunidad', 'Dropshippers Argentina', 'Comunidad internacional', 'cerrado', 'Argentina', '11111111-1111-1111-1111-111111111111', 'EFXAR20');

-- ---------- v2: decisiones estratégicas --------------------------------------
insert into decisiones_estrategicas (titulo, contexto, decision_tomada, responsable_id, tags) values
  ('Fechas del evento 2026', 'Se evaluó septiembre vs octubre', 'Se fija 16–18 de octubre por disponibilidad de Plaza Mayor', '11111111-1111-1111-1111-111111111111', array['fechas']),
  ('Precio de boleta general', 'Análisis de ediciones anteriores', 'Boleta general a 180.000 COP con early bird', '11111111-1111-1111-1111-111111111111', array['precios']);

-- ---------- v2: biblioteca (placeholders; los archivos reales entran por Drive)
insert into biblioteca_archivos (nombre, tipo, area_relacionada, tags, subido_por)
select 'Logo Feria Effix (principal)', 'logo', null, array['marca','logo'], '11111111-1111-1111-1111-111111111111';
insert into biblioteca_archivos (nombre, tipo, area_relacionada, tags, subido_por)
select 'Plano comercial Plaza Mayor', 'plano', (select id from areas where nombre='stands'), array['plano','stands'], '11111111-1111-1111-1111-111111111111';

-- ---------- Pipelines propios por área (Bloque pipelines) -------------------
insert into iniciativas_marketing (titulo, canal, etapa, presupuesto_asignado, resultado_principal) values
  ('Calendario de contenidos pre-evento', 'otro', 'activo', 0, null),
  ('Campaña Meta Ads venta boletas', 'meta_ads', 'activo', 40000000, 'CTR 3.2% · CVR 1.8%'),
  ('Colaboración con influencers e-commerce', 'influencers', 'idea', 15000000, null);

insert into solicitudes_diseno (titulo, tipo_pieza, prioridad, etapa, area_solicitante)
select 'Escarapelas ponentes Black', 'escarapela', 'alta', 'en_diseno', (select id from areas where nombre='ponentes');
insert into solicitudes_diseno (titulo, tipo_pieza, prioridad, etapa) values
  ('Banner principal home', 'banner', 'urgente', 'solicitado'),
  ('Señalética auditorios', 'senaletica', 'media', 'aprobado');

insert into piezas_video (titulo, tipo, etapa) values
  ('Recap edición 2025', 'recap', 'edicion'),
  ('Testimonio patrocinador Envia', 'testimonio', 'guion'),
  ('Video ponente keynote', 'ponente', 'grabacion');

insert into items_produccion (descripcion, categoria, etapa, proveedor, costo_estimado) values
  ('Tarima principal auditorio 1', 'montaje', 'contratado', 'Eventos Pro', 25000000),
  ('Sonido e iluminación', 'sonido', 'cotizado', null, 18000000),
  ('Catering staff 3 días', 'catering', 'planeado', null, 9000000);
