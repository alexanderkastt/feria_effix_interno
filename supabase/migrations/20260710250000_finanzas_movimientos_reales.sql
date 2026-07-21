-- ============================================================================
-- Finanzas (Bloque B) — libro contable REAL (ingresos y egresos ejecutados).
-- Autor lógico: db-architect.
--
-- Distinto del presupuesto maestro (Bloque A: categorias_presupuesto /
-- lineas_presupuesto, ya en producción, NO se toca acá). Este bloque registra
-- movimientos reales transacción por transacción, para poder cruzarlos contra
-- el plan vía categoria_id.
--
-- Depende de (creado en 20260710220000_finanzas_permisos.sql, NO se toca acá):
--   - enum nivel_sensibilidad
--   - función puede_ver_nivel_financiero(nivel_sensibilidad, uuid, text, uuid)
--   - helpers es_admin_global(), es_gestor_area(), es_finanzas_operativo(),
--     puede_ver_area(uuid) (este último de init.sql)
--   - trigger genérico touch_actualizado_en() (de 20260701211633_init.sql,
--     NO se crea una función nueva acá)
--
-- Referencia por FK (NO se tocan): categorias_presupuesto (Bloque A), areas,
-- stands, patrocinios, stands_devoluciones.
--
-- RLS ACTIVADO en ambas tablas desde su creación (regla no negociable).
--
-- No se insertan datos en esta migración (Bloque C, a cargo del usuario con
-- los 239 ingresos + subset de egresos ya validados del Excel). No se crean
-- triggers que generen movimientos automáticamente desde stands/patrocinios:
-- se revisaron las migraciones de stands (20260701235000_stands_reales.sql,
-- 20260707180000_stands_historial.sql) y los únicos triggers financieros
-- existentes ahí son internos de ese módulo (recalculan
-- stands.valor_restante / stands.precio a partir de pagos_stand, no generan
-- filas en ningún libro contable de Finanzas) — no hay ningún trigger previo
-- que haya que respetar ni modificar en este bloque.
-- ============================================================================

-- ---------- Tipos ------------------------------------------------------------
create type origen_ingreso as enum ('stand', 'boleteria', 'patrocinio', 'otro');
comment on type origen_ingreso is
  'De dónde proviene un movimiento de movimientos_ingresos: venta de stand, '
  'boletería, patrocinio, u otro origen no cubierto por las anteriores.';

-- ============================================================================
-- movimientos_ingresos
-- ============================================================================
-- Libro de ingresos REALES (hoja "INGRESOS" del Excel), transacción por
-- transacción. categoria_id es nullable a propósito: no todo movimiento tiene
-- por qué tener categoría de presupuesto asignada al momento de cargarlo.
create table movimientos_ingresos (
  id uuid primary key default gen_random_uuid(),
  fecha_creacion date not null,
  numero_factura text,
  cliente_nombre text,
  cliente_nit text,
  concepto text,
  total_bruto numeric(14, 2),
  descuentos numeric(14, 2),
  subtotal numeric(14, 2),
  impuestos numeric(14, 2),
  total_neto numeric(14, 2),
  categoria_id uuid references categorias_presupuesto (id),
  origen origen_ingreso not null default 'otro',
  stand_id uuid references stands (id) on delete set null,
  patrocinio_id uuid references patrocinios (id) on delete set null,
  subido_a_effisystems boolean not null default false,
  nivel_sensibilidad nivel_sensibilidad not null default 'detalle',
  area_id uuid references areas (id),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table movimientos_ingresos is
  'Libro contable REAL de ingresos ejecutados (hoja "INGRESOS" del Excel '
  'original), transacción por transacción — distinto de lineas_presupuesto '
  '(Bloque A, el PLAN). categoria_id nullable: permite cargar un movimiento '
  'sin categoría de presupuesto asignada todavía. nivel_sensibilidad default '
  '"detalle" (NIVEL 2 del modelo de Bloque 0): un movimiento de ingreso '
  'individual con cliente/monto/factura es riesgo medio. Sube a "personal" '
  'fila por fila cuando el equipo decida que ese registro puntual debe '
  'restringirse más (ver comment de cliente_nit sobre la limitación conocida '
  'de sensibilidad mixta dentro de la misma fila). INSERT/UPDATE/DELETE '
  'reservados a es_admin_global() por ahora — el módulo sigue sin exponerse '
  'al resto del equipo. No se insertan datos en este bloque (Bloque C).';

comment on column movimientos_ingresos.fecha_creacion is
  'Fecha de la transacción (fecha de la factura/registro en el Excel), NO '
  'confundir con creado_en (cuándo se insertó la fila en esta base de datos).';

comment on column movimientos_ingresos.subido_a_effisystems is
  'true si la factura ya fue subida al ERP Effisystems (Grupo Effi). Viene de '
  'la columna "sc" de la hoja INGRESOS del Excel original. Flag operativo '
  'normal: se gobierna por el nivel_sensibilidad de la fila entera, igual que '
  'cualquier otra columna — no tiene control de acceso propio.';

comment on column movimientos_ingresos.categoria_id is
  'Nullable: no todo movimiento tiene categoría de presupuesto asignada al '
  'momento de cargarlo. Permite cruzar movimientos reales contra el plan '
  '(categorias_presupuesto / lineas_presupuesto, Bloque A) cuando sí la tiene.';

comment on column movimientos_ingresos.area_id is
  'Nullable. Igual que en lineas_presupuesto (Bloque A): permite que '
  'gestor_area vea algún día un "resumen" agregado de su propia área. A '
  'diferencia de lineas_presupuesto.area_id, ACÁ NO se sincroniza automática '
  'ni obligatoriamente desde categoria_id vía trigger — se deja como columna '
  'independiente porque un movimiento real puede no tener categoría pero sí '
  'un área conocida (ej. un ingreso de stand siempre es del área "stands"), '
  'o viceversa. Quien cargue el dato la completa a mano si corresponde.';

comment on column movimientos_ingresos.cliente_nit is
  'LIMITACIÓN CONOCIDA DE DISEÑO (documentada explícitamente, sin resolver '
  'en este bloque): conceptualmente el NIT de un cliente es dato nivel '
  '"personal" (el más sensible), pero esta tabla mezcla columnas de distinto '
  'nivel de sensibilidad en la MISMA fila (igual que en lineas_presupuesto, '
  'Bloque A) y nivel_sensibilidad se define a nivel de FILA, no de columna. '
  'Resultado: hoy, quien puede ver una fila "detalle" (es_admin_global() o '
  'es_finanzas_operativo(), sin restricción de área — ver '
  'puede_ver_nivel_financiero()) ve también cliente_nit de esa fila, aunque '
  'el NIT en sí ameritaría el filtro más estricto de "personal". '
  ''
  'Se evaluó resolverlo con privilegios a nivel de columna de Postgres '
  '(GRANT SELECT (columnas...) ON movimientos_ingresos TO rol), pero NO '
  'aplica en este esquema: Supabase/PostgREST autentica a todos los usuarios '
  'logueados bajo el MISMO rol de Postgres ("authenticated") y diferencia '
  'entre ellos vía auth.uid() dentro de las políticas RLS — un GRANT de '
  'columna se aplicaría a "authenticated" como conjunto, no podría distinguir '
  'un finanzas_operativo de un admin dentro de ese mismo rol. Column-level '
  'privileges de Postgres no son la herramienta para RLS por-usuario.'
  ''
  'Alternativa limpia recomendada para Bloque F (o antes, si el usuario lo '
  'pide): una vista (o función RPC) que exponga cliente_nit como NULL para '
  'quien no tenga permiso "personal" sobre esa fila (reusando '
  'tiene_excepcion_personal()/es_admin_global()), y que la aplicación lea '
  'SIEMPRE desde esa vista en vez de la tabla base. No se crea en este bloque '
  'porque el prompt de este bloque excluye explícitamente construir '
  'vistas/páginas — queda documentado acá como limitación conocida a '
  'resolver cuando corresponda.';

create index movimientos_ingresos_categoria_idx on movimientos_ingresos (categoria_id);
create index movimientos_ingresos_area_idx on movimientos_ingresos (area_id);
create index movimientos_ingresos_fecha_idx on movimientos_ingresos (fecha_creacion);
create index movimientos_ingresos_stand_idx on movimientos_ingresos (stand_id);
create index movimientos_ingresos_patrocinio_idx on movimientos_ingresos (patrocinio_id);

create trigger movimientos_ingresos_touch
  before update on movimientos_ingresos
  for each row execute function touch_actualizado_en();

alter table movimientos_ingresos enable row level security;

create policy movimientos_ingresos_select on movimientos_ingresos
  for select to authenticated using (
    puede_ver_nivel_financiero(nivel_sensibilidad, area_id, categoria_id::text, id)
  );

create policy movimientos_ingresos_insert on movimientos_ingresos
  for insert to authenticated with check (es_admin_global());
create policy movimientos_ingresos_update on movimientos_ingresos
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy movimientos_ingresos_delete on movimientos_ingresos
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on movimientos_ingresos to authenticated;

-- ============================================================================
-- movimientos_egresos
-- ============================================================================
-- Libro de egresos REALES (hoja "Egresos" del Excel), transacción por
-- transacción. devolucion_id queda listo (nullable) para el cruce de
-- "Devoluciones de venta" del Bloque C, que viene después.
create table movimientos_egresos (
  id uuid primary key default gen_random_uuid(),
  fecha date,
  proveedor_nombre text,
  descripcion_servicio text,
  observaciones text,
  rubro_agrupado text,
  subrubro text,
  valor_antes_iva numeric(14, 2),
  impuestos numeric(14, 2),
  retenciones numeric(14, 2),
  total_neto numeric(14, 2),
  numero_factura_proveedor text,
  numero_comprobante_effi text,
  lleva_factura_electronica boolean,
  subido_a_effisystems boolean not null default false,
  categoria_id uuid references categorias_presupuesto (id),
  area_id uuid references areas (id),
  devolucion_id uuid references stands_devoluciones (id) on delete set null,
  nivel_sensibilidad nivel_sensibilidad not null default 'detalle',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table movimientos_egresos is
  'Libro contable REAL de egresos ejecutados (hoja "Egresos" del Excel '
  'original), transacción por transacción — distinto de lineas_presupuesto '
  '(Bloque A, el PLAN). categoria_id/area_id nullable: permiten cargar un '
  'movimiento sin clasificar todavía y cruzarlo luego contra el presupuesto. '
  'devolucion_id nullable, listo para el cruce de "Devoluciones de venta" '
  'del Bloque C (todavía no se usa en este bloque). nivel_sensibilidad '
  'default "detalle" (NIVEL 2), mismo criterio que movimientos_ingresos. '
  'INSERT/UPDATE/DELETE reservados a es_admin_global() por ahora. No se '
  'insertan datos en este bloque (Bloque C, subset de las 618 filas '
  'originales pendiente de confirmar con el usuario).';

comment on column movimientos_egresos.fecha is
  'Nullable: el usuario pidió migrar las 618 filas de la hoja "Egresos" del '
  'Excel tal cual, incluidas las 304 que están completamente vacías (plantilla '
  'sin usar, sin ningún dato en ninguna columna) — no solo las 313 con valor '
  'real. Esas filas vacías quedan como registros con casi todo en null, listos '
  'para completarse después manualmente.';

comment on column movimientos_egresos.subido_a_effisystems is
  'true si el egreso ya fue subido al ERP Effisystems. La hoja "Egresos" del '
  'Excel original NO tenía esta columna (a diferencia de "sc" en INGRESOS) '
  '— se agrega igual por pedido explícito del usuario, para que el equipo '
  'empiece a usarla de ahora en más. Mismo criterio que en '
  'movimientos_ingresos: flag operativo normal, gobernado por el '
  'nivel_sensibilidad de la fila entera, sin control de acceso propio.';

comment on column movimientos_egresos.devolucion_id is
  'FK a stands_devoluciones, nullable. Se deja lista para el cruce de '
  '"Devoluciones de venta" que se resuelve en el Bloque C (carga de datos), '
  'no se usa todavía en este bloque.';

create index movimientos_egresos_categoria_idx on movimientos_egresos (categoria_id);
create index movimientos_egresos_area_idx on movimientos_egresos (area_id);
create index movimientos_egresos_fecha_idx on movimientos_egresos (fecha);
create index movimientos_egresos_devolucion_idx on movimientos_egresos (devolucion_id);

create trigger movimientos_egresos_touch
  before update on movimientos_egresos
  for each row execute function touch_actualizado_en();

alter table movimientos_egresos enable row level security;

create policy movimientos_egresos_select on movimientos_egresos
  for select to authenticated using (
    puede_ver_nivel_financiero(nivel_sensibilidad, area_id, categoria_id::text, id)
  );

create policy movimientos_egresos_insert on movimientos_egresos
  for insert to authenticated with check (es_admin_global());
create policy movimientos_egresos_update on movimientos_egresos
  for update to authenticated using (es_admin_global()) with check (es_admin_global());
create policy movimientos_egresos_delete on movimientos_egresos
  for delete to authenticated using (es_admin_global());

grant select, insert, update, delete on movimientos_egresos to authenticated;
