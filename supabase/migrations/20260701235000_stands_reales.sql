-- ============================================================================
-- Feria Effix 2026 — Ampliación de `stands` al schema real (Excel "CONTROL
-- STANDS FERIA EFFIX 2026.xlsx", hoja "STANDS 2026", 289 filas + hojas
-- "Devoluciones" y "LINKS").
-- Autor lógico: db-architect
--
-- REGLA DURA DE ESTA MIGRACIÓN: no se renombra ni se elimina ninguna columna
-- ni valor de enum existente de `stands` (precio, nombre, tamano, estado con
-- sus 4 valores, cliente_nombre, cliente_email, cliente_telefono,
-- bloqueado_hasta, patrocinador_id). Todo lo nuevo se agrega en paralelo.
-- El enum `estado_stand` (mapa público / bloqueos temporales) queda intacto;
-- se agrega un enum NUEVO y separado `estado_venta_stand` para el estado
-- comercial real del Excel. No se mezclan.
--
-- RLS ACTIVADO en toda tabla nueva desde su creación (regla no negociable).
-- ============================================================================

-- ---------- Enums nuevos (nombres verificados contra los ya existentes:
-- estado_stand, tier_patrocinio, estado_pago — ninguno se toca ni se reutiliza)
-- ----------------------------------------------------------------------------
create type stand_pabellon as enum (
  'azul', 'amarillo', 'blanco', 'rojo', 'zona_comidas', 'burbujas',
  'gran_salon', 'plazoleta', 'hall_verde', 'hall'
);

create type tipo_stand_enum as enum ('isla', 'tipo_u', 'esquinero', 'lineal');

create type categoria_cliente_stand as enum (
  'academia_educacion', 'comercializadora_distribuidor', 'fabricante',
  'importaciones', 'logistica', 'plataforma', 'servicios'
);

-- Estado comercial real (Excel). Independiente del `estado_stand` operativo
-- que usa el mapa público / bloqueos temporales — NO se unifican.
create type estado_venta_stand as enum (
  'disponible', 'reservado', 'pago_100', 'sin_pagos', 'canje', 'obsequio_directivo'
);

create type medio_pago_enum as enum (
  'cuenta_banco_effix', 'efectivo', 'mercado_pago', 'payoneer',
  'trazabilidad_effi', 'usdt'
);

create type forma_pago_restante_enum as enum (
  'bimestral_directo', 'mensual_directo', 'mensual_debito_efficomerce',
  'solo_un_pago', 'ya_pago_totalidad'
);

create type frecuencia_participacion_enum as enum (
  'primera_vez', 'segunda_vez', 'mas_de_tres'
);

-- Usado por pagos_stand.tipo_pago (distinto del medio_pago_enum de arriba).
create type tipo_pago_stand as enum ('primer_abono', 'abono_adicional', 'pago_final');

-- Usado por stands_devoluciones.estado_devolucion. Los matices de texto libre
-- de la hoja "Devoluciones" (ej. "el cliente deja el abono como saldo a favor
-- para la feria Effix 2027") van en la columna `observaciones`, no en el enum.
create type estado_devolucion_stand as enum (
  'ok', 'pendiente_certificacion_bancaria', 'pendiente_documento_liquidacion',
  'saldo_a_favor'
);

-- ---------- Tabla nueva: catálogo de asesores comerciales -------------------
-- Se crea antes de alterar `stands` porque `stands.asesor_id` la referencia.
create table asesores_comerciales (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  activo boolean not null default true,
  email text,
  telefono text,
  creado_en timestamptz not null default now()
);
comment on table asesores_comerciales is
  'Catálogo de asesores comerciales de stands. Lectura: todo authenticated. '
  'Escritura: solo quien puede editar el área stands. Se siembran los 4 '
  'asesores reales de la hoja 2026; se agregan más manualmente desde el panel.';

insert into asesores_comerciales (nombre_completo) values
  ('Alejandra Tomate'),
  ('Estefanía Montoya'),
  ('Lucía Jaramillo'),
  ('Walter García');

-- ---------- Ampliación de `stands` (todo nullable salvo lo indicado) --------
alter table stands add column if not exists pabellon stand_pabellon;
alter table stands add column if not exists tipo_stand tipo_stand_enum;
alter table stands add column if not exists valor_sin_iva numeric(14, 2);
alter table stands add column if not exists valor_con_iva numeric(14, 2);
-- Precio real de venta (puede diferir de valor_con_iva por descuentos
-- negociados). NO reemplaza a la columna `precio` existente: esa sigue
-- intacta y en uso por el flujo de reserva pública / mapa.
alter table stands add column if not exists precio_venta numeric(14, 2);
alter table stands add column if not exists nombre_fiscal text;
alter table stands add column if not exists nombre_persona_encargada text;
-- Casi sin uso real en la data (1 de 289 filas): texto libre simple.
alter table stands add column if not exists id_effi text;
-- El Excel mezcla ciudades y países de clientes internacionales en una sola
-- columna; no existe columna país separada en la data real. Se modela tal cual.
alter table stands add column if not exists ciudad text;
alter table stands add column if not exists categoria_cliente categoria_cliente_stand;
alter table stands add column if not exists asesor_id uuid references asesores_comerciales (id) on delete set null;
alter table stands add column if not exists estado_venta estado_venta_stand;
-- A quién se le hizo el obsequio cuando estado_venta = 'obsequio_directivo'
-- (ej. "Sara", "Juan David"). Texto libre, sin catálogo propio.
alter table stands add column if not exists obsequio_de text;
alter table stands add column if not exists valor_primer_abono numeric(14, 2);
alter table stands add column if not exists medio_pago_primer_abono medio_pago_enum;
alter table stands add column if not exists forma_pago_restante forma_pago_restante_enum;
-- Recalculado automáticamente por trigger (ver más abajo) a partir de
-- precio_venta - SUM(pagos_stand.monto). Nunca se edita a mano.
alter table stands add column if not exists valor_restante numeric(14, 2) not null default 0;
-- Excel real: TRUE/FALSE simple, no es un link a archivo.
alter table stands add column if not exists pantallazo_aceptacion boolean not null default false;
-- Excel real: "Si" o vacío -> boolean, no enum de 3 valores.
alter table stands add column if not exists aprobacion_tesoreria boolean not null default false;
alter table stands add column if not exists fecha_venta date;
alter table stands add column if not exists primera_vez_en_feria frecuencia_participacion_enum;
-- Excel real: "Check" o vacío -> boolean.
alter table stands add column if not exists facturado boolean not null default false;
alter table stands add column if not exists numero_factura text;
-- Checklist operativo
alter table stands add column if not exists contrato_entregado boolean not null default false;
alter table stands add column if not exists manual_entregado boolean not null default false;
alter table stands add column if not exists logo_recibido boolean not null default false;
alter table stands add column if not exists marcado_en_mapa boolean not null default false;
alter table stands add column if not exists publicado_web boolean not null default false;
alter table stands add column if not exists imagen_enviada boolean not null default false;
alter table stands add column if not exists formulario_directorio_lleno boolean not null default false;
alter table stands add column if not exists paz_y_salvo boolean not null default false;
-- El Excel tiene DOS columnas "Observaciones" distintas.
alter table stands add column if not exists observaciones_venta text;
alter table stands add column if not exists observaciones_facturacion text;
-- Stands no habilitados para venta (hoy 0 casos reales en 2026, se deja
-- preparado). El frontend (mapa público) es quien debe excluir habilitado=false;
-- esta migración solo agrega la columna.
alter table stands add column if not exists habilitado boolean not null default true;

comment on column stands.precio is
  'Precio operativo usado por el flujo de reserva pública / mapa. NO confundir '
  'con precio_venta (precio real negociado, columna nueva de este bloque).';
comment on column stands.estado is
  'Estado OPERATIVO del mapa público / bloqueos temporales (disponible, '
  'bloqueado_temporal, reservado, vendido). No confundir con estado_venta '
  '(estado comercial real del Excel de control de stands).';
comment on column stands.estado_venta is
  'Estado comercial real (hoja de control de stands). Independiente de `estado`.';
comment on column stands.valor_restante is
  'Recalculado automáticamente por trigger a partir de pagos_stand y de '
  'precio_venta. No editar a mano.';
comment on column stands.ciudad is
  'Ciudad o país del cliente tal cual viene en el Excel real (mezclados). No hay columna país separada.';
comment on column stands.id_effi is
  'Identificador interno "Effi" del cliente. Casi sin uso en la data real (1/289 filas).';

-- Índices de apoyo para reportes (tabla pequeña hoy, pero se preparan).
create index if not exists stands_asesor_idx on stands (asesor_id);
create index if not exists stands_estado_venta_idx on stands (estado_venta);
create index if not exists stands_pabellon_idx on stands (pabellon);

-- ---------- Tabla nueva: pagos_stand -----------------------------------------
create table pagos_stand (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references stands (id) on delete cascade,
  monto numeric(14, 2) not null,
  fecha date not null default current_date,
  medio_pago medio_pago_enum,
  tipo_pago tipo_pago_stand,
  registrado_por uuid references usuarios (id) on delete set null,
  creado_en timestamptz not null default now()
);
create index pagos_stand_stand_idx on pagos_stand (stand_id);
comment on table pagos_stand is
  'Historial de abonos/pagos por stand. Alimenta stands.valor_restante vía trigger '
  '(ver recalcular_valor_restante_stand más abajo). No se edita valor_restante a mano.';

-- ---------- Tabla nueva: stands_devoluciones --------------------------------
create table stands_devoluciones (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: el stand puede haberse revendido a otro cliente; no se quiere
  -- bloquear el insert ni perder el registro histórico de la devolución.
  stand_id uuid references stands (id) on delete set null,
  pabellon stand_pabellon,
  codigo text,
  valor_pagado_hasta_devolucion numeric(14, 2),
  estado_devolucion estado_devolucion_stand,
  motivo text,
  observaciones text,
  -- Nullable: el Excel no tiene esta fecha para los registros históricos.
  fecha_devolucion date,
  creado_en timestamptz not null default now()
);
create index stands_devoluciones_stand_idx on stands_devoluciones (stand_id);
comment on table stands_devoluciones is
  'Histórico de devoluciones (hoja "Devoluciones" del Excel). stand_id puede '
  'quedar huérfano (on delete set null) para no perder el registro histórico.';

-- ---------- Tabla nueva: stand_beneficios -----------------------------------
create table stand_beneficios (
  id uuid primary key default gen_random_uuid(),
  stand_id uuid not null references stands (id) on delete cascade,
  cantidad_escarapelas int not null default 0,
  cantidad_combos_boletas int not null default 0,
  creado_en timestamptz not null default now(),
  -- Adición razonable fuera del pedido literal: estas cantidades suelen
  -- ajustarse después de creado el registro, así que se agrega
  -- actualizado_en + trigger touch (mismo patrón que el resto del esquema)
  -- para poder auditar cambios. Ver nota de decisiones al final del archivo.
  actualizado_en timestamptz not null default now()
);
create index stand_beneficios_stand_idx on stand_beneficios (stand_id);
comment on table stand_beneficios is
  'Beneficios asignados por stand (escarapelas, combos de boletas). Un stand '
  'puede tener más de una fila si se otorgan beneficios adicionales en distintos momentos.';

create trigger stand_beneficios_touch before update on stand_beneficios
  for each row execute function touch_actualizado_en();

-- ============================================================================
-- Trigger: recalcular stands.valor_restante = precio_venta - SUM(pagos_stand)
-- No es columna generada porque precio_venta puede cambiar independientemente.
-- ============================================================================
create or replace function recalcular_valor_restante_stand(p_stand_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update stands
  set valor_restante = coalesce(precio_venta, 0) - coalesce((
    select sum(monto) from pagos_stand where stand_id = p_stand_id
  ), 0)
  where id = p_stand_id;
end;
$$;

create or replace function trg_pagos_stand_recalcular()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform recalcular_valor_restante_stand(old.stand_id);
    return old;
  end if;

  perform recalcular_valor_restante_stand(new.stand_id);
  if TG_OP = 'UPDATE' and old.stand_id is distinct from new.stand_id then
    perform recalcular_valor_restante_stand(old.stand_id);
  end if;
  return new;
end;
$$;

create trigger pagos_stand_recalcular_iu
  after insert or update on pagos_stand
  for each row execute function trg_pagos_stand_recalcular();
create trigger pagos_stand_recalcular_d
  after delete on pagos_stand
  for each row execute function trg_pagos_stand_recalcular();

-- Adición razonable fuera del pedido literal: si `precio_venta` cambia sin
-- que haya ningún movimiento en pagos_stand (ej. se corrige un precio
-- negociado), valor_restante quedaría desactualizado hasta el próximo pago.
-- Se agrega este trigger complementario para mantenerlo siempre consistente,
-- sin tocar la implementación pedida (sigue siendo un trigger, no columna
-- generada). No genera recursión: esta actualización solo toca la columna
-- valor_restante, por lo que "update of precio_venta" no vuelve a dispararse.
create or replace function trg_stands_recalcular_valor_restante()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform recalcular_valor_restante_stand(new.id);
  return new;
end;
$$;

create trigger stands_precio_venta_recalcular
  after insert or update of precio_venta on stands
  for each row execute function trg_stands_recalcular_valor_restante();

-- ============================================================================
-- RLS — activado en todas las tablas nuevas + políticas explícitas,
-- siguiendo exactamente el patrón de 20260701221332_stands_patrocinios.sql.
-- ============================================================================
alter table asesores_comerciales enable row level security;
alter table pagos_stand enable row level security;
alter table stands_devoluciones enable row level security;
alter table stand_beneficios enable row level security;

-- asesores_comerciales: catálogo compartido, lectura para todo authenticated;
-- escritura solo para quien puede editar el área 'stands'.
create policy asesores_comerciales_select on asesores_comerciales
  for select to authenticated using (true);
create policy asesores_comerciales_write on asesores_comerciales
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- pagos_stand: mismo criterio que stands (ver/editar área 'stands').
create policy pagos_stand_select on pagos_stand
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy pagos_stand_write on pagos_stand
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- stands_devoluciones: mismo criterio.
create policy stands_devoluciones_select on stands_devoluciones
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy stands_devoluciones_write on stands_devoluciones
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- stand_beneficios: mismo criterio.
create policy stand_beneficios_select on stand_beneficios
  for select to authenticated using (
    puede_ver_area((select id from areas where nombre = 'stands'))
  );
create policy stand_beneficios_write on stand_beneficios
  for all to authenticated using (
    puede_editar_area((select id from areas where nombre = 'stands'))
  ) with check (
    puede_editar_area((select id from areas where nombre = 'stands'))
  );

-- ---------- Grants ------------------------------------------------------------
grant select, insert, update, delete on
  asesores_comerciales, pagos_stand, stands_devoluciones, stand_beneficios
  to authenticated;

-- ============================================================================
-- Notas de diseño / decisiones tomadas por criterio propio (dentro del
-- alcance pedido, sin romper nada existente):
--
-- 1. Nombré los dos enums que la especificación dejaba sin nombre explícito:
--    `tipo_pago_stand` (pagos_stand.tipo_pago) y `estado_devolucion_stand`
--    (stands_devoluciones.estado_devolucion), siguiendo el patrón
--    <concepto>_<tabla/entidad> ya usado (categoria_cliente_stand,
--    estado_venta_stand).
-- 2. Agregué `actualizado_en` + trigger touch a `stand_beneficios` (no pedido
--    explícitamente) porque las cantidades de escarapelas/combos son datos
--    que probablemente se editan después de creado el registro; es
--    consistente con el resto del esquema y no rompe nada.
-- 3. Agregué un segundo trigger (`stands_precio_venta_recalcular`) para que
--    `valor_restante` también se recalcule cuando cambia `precio_venta` sin
--    que haya movimientos nuevos en `pagos_stand` — evita que quede
--    desactualizado. Sigue siendo un trigger (no columna generada), tal como
--    se pidió; solo se amplió el disparador.
-- 4. Agregué índices (`stands_asesor_idx`, `stands_estado_venta_idx`,
--    `stands_pabellon_idx`, `pagos_stand_stand_idx`,
--    `stands_devoluciones_stand_idx`, `stand_beneficios_stand_idx`) para las
--    consultas de reportes que previsiblemente se harán sobre estas columnas.
-- 5. No agregué constraint UNIQUE en `stand_beneficios.stand_id`: la
--    especificación no pide 1:1 y preferí no asumir esa regla de negocio; si
--    en la práctica cada stand debe tener una sola fila de beneficios, se
--    puede agregar esa unicidad en una migración futura.
-- 6. No toqué `stands_publico` (la vista pública) ni agregué las columnas
--    nuevas a ella: son datos comerciales/PII internos (nombre_fiscal,
--    observaciones, valores, etc.) que no deben exponerse al público. Si el
--    frontend público necesita `pabellon` o `tipo_stand` para el mapa, eso
--    se agrega en una migración separada y explícita a `stands_publico`.
-- ============================================================================
