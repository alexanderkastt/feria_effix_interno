-- ============================================================================
-- Finanzas (Bloque 0) — modelo de permisos por nivel de sensibilidad.
-- Autor lógico: auth-rbac-builder.
--
-- Este bloque SOLO define el modelo de acceso (enum + funciones RLS +
-- mecanismo de excepciones). NO crea tablas de datos financieros (presupuesto,
-- movimientos de ingresos/egresos, nómina, etc. — más allá de las ya
-- existentes `ingresos`/`gastos` de 20260701222729_v2_modulos.sql, que este
-- bloque NO toca). Las tablas financieras nuevas que cree db-architect en
-- bloques posteriores deberán tener:
--   - una columna `nivel_sensibilidad nivel_sensibilidad not null`
--   - una FK a `areas` (area_id uuid references areas(id)), aunque sea
--     nullable para movimientos que no son de un área específica (ej. nómina
--     general)
--   - opcionalmente una columna `categoria text` (para el mecanismo de
--     excepciones de nivel 'personal', ver más abajo)
-- para poder invocar `puede_ver_nivel_financiero(...)` en sus políticas RLS
-- de SELECT en vez de repetir la lógica de roles en cada tabla.
-- ============================================================================

-- ---------- Enum reutilizable ----------------------------------------------
create type nivel_sensibilidad as enum ('resumen', 'detalle', 'personal');
comment on type nivel_sensibilidad is
  'Nivel de sensibilidad de un registro financiero. '
  'resumen = totales agregados/porcentaje de ejecución de presupuesto (bajo riesgo). '
  'detalle = líneas individuales de ingreso/egreso con proveedor o cliente, monto, fecha, número de factura (riesgo medio). '
  'personal = NITs de clientes, nómina individual por nombre, datos bancarios (riesgo alto).';

-- ---------- Helpers de rol (mismo patrón que es_directivo() en init.sql) ----
create or replace function es_gestor_area()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol_base = 'gestor_area'
  );
$$;
comment on function es_gestor_area() is
  'true si el usuario autenticado tiene rol_base = gestor_area. Helper de RLS, sin recursión (security definer).';

create or replace function es_finanzas_operativo()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from usuarios where id = auth.uid() and rol_base = 'finanzas_operativo'
  );
$$;
comment on function es_finanzas_operativo() is
  'true si el usuario autenticado tiene rol_base = finanzas_operativo. '
  'Hoy (bloque 0 de Finanzas) este rol existe en el enum pero no está asignado a nadie: '
  'esta función seguirá devolviendo false para todos hasta que directivo/administrativo '
  'asigne el rol a alguien desde /panel/admin/usuarios.';

-- ---------- Mecanismo de excepción para nivel 'personal' --------------------
-- directivo/administrativo pueden habilitar, registro por registro o
-- categoría por categoría (opcionalmente acotada a un área), que un usuario
-- con rol finanzas_operativo vea un dato nivel 'personal' puntual que por
-- defecto no vería. No depende de las tablas financieras futuras: referencia
-- el registro por su id (registro_id) sin FK dura, porque esas tablas
-- todavía no existen (las crea db-architect después).
create table finanzas_excepciones_acceso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  -- Alcance de la excepción: exactamente uno de los dos.
  registro_id uuid,          -- excepción puntual: un movimiento/línea específica (id de la fila)
  categoria text,            -- excepción por categoría completa (ej. 'nomina', 'proveedores')
  area_id uuid references areas (id) on delete cascade, -- opcional: acota una excepción por categoría a un área
  otorgado_por uuid not null references usuarios (id),
  otorgado_en timestamptz not null default now(),
  vigente_hasta timestamptz, -- null = sin caducidad
  motivo text,
  constraint excepcion_alcance_unico check (
    (registro_id is not null and categoria is null) or
    (registro_id is null and categoria is not null)
  )
);
comment on table finanzas_excepciones_acceso is
  'Excepciones explícitas para exponer un dato nivel "personal" a un usuario que por '
  'defecto no lo vería (hoy, en la práctica, finanzas_operativo). Se otorgan registro '
  'por registro (registro_id) o categoría por categoría (categoria, opcionalmente '
  'acotada a un área con area_id). Solo directivo/administrativo puede crearlas '
  '(ver policy finanzas_excepciones_admin) — la propia tabla no valida "quién puede '
  'otorgar" más allá de RLS, así que otorgado_por es solo informativo/auditoría.';

create index finanzas_excepciones_usuario_idx on finanzas_excepciones_acceso (usuario_id);
create index finanzas_excepciones_registro_idx
  on finanzas_excepciones_acceso (registro_id) where registro_id is not null;
create index finanzas_excepciones_categoria_idx
  on finanzas_excepciones_acceso (categoria) where categoria is not null;

alter table finanzas_excepciones_acceso enable row level security;

create policy finanzas_excepciones_select_propia on finanzas_excepciones_acceso
  for select to authenticated using (usuario_id = auth.uid() or es_admin_global());
create policy finanzas_excepciones_admin on finanzas_excepciones_acceso
  for all to authenticated using (es_admin_global()) with check (es_admin_global());

grant select, insert, update, delete on finanzas_excepciones_acceso to authenticated;

create or replace function tiene_excepcion_personal(
  p_registro_id uuid default null,
  p_categoria text default null,
  p_area_id uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from finanzas_excepciones_acceso e
    where e.usuario_id = auth.uid()
      and (e.vigente_hasta is null or e.vigente_hasta > now())
      and (
        (p_registro_id is not null and e.registro_id = p_registro_id)
        or (
          p_categoria is not null and e.categoria = p_categoria
          and (e.area_id is null or e.area_id = p_area_id)
        )
      )
  );
$$;
comment on function tiene_excepcion_personal(uuid, text, uuid) is
  'Uso interno de puede_ver_nivel_financiero(). Chequea si el usuario autenticado '
  'tiene una excepción vigente (por registro puntual o por categoría/área) en '
  'finanzas_excepciones_acceso. No se llama directamente desde políticas RLS de '
  'tablas de negocio: siempre a través de puede_ver_nivel_financiero().';

-- ---------- Función central para políticas RLS de tablas financieras -------
create or replace function puede_ver_nivel_financiero(
  p_nivel nivel_sensibilidad,
  p_area_id uuid,
  p_categoria text default null,
  p_registro_id uuid default null
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case p_nivel
    when 'resumen' then
      -- directivo/administrativo ven todo; gestor_area SOLO su propia área
      -- (puede_ver_area ya compara contra usuario_areas del usuario que consulta).
      es_admin_global() or (es_gestor_area() and puede_ver_area(p_area_id))
    when 'detalle' then
      -- directivo/administrativo y finanzas_operativo, sin restricción de área.
      es_admin_global() or es_finanzas_operativo()
    when 'personal' then
      -- solo directivo/administrativo por defecto; finanzas_operativo solo si
      -- hay una excepción explícita vigente para ese registro o esa categoría.
      es_admin_global() or (
        es_finanzas_operativo()
        and tiene_excepcion_personal(p_registro_id, p_categoria, p_area_id)
      )
    else false
  end;
$$;

comment on function puede_ver_nivel_financiero(nivel_sensibilidad, uuid, text, uuid) is
$doc$Punto único de verdad para políticas RLS de SELECT en tablas del módulo de
Finanzas (las crea db-architect en bloques posteriores). Cada tabla financiera
debe tener columnas nivel_sensibilidad y area_id (ver comentario al inicio de
esta migración) e invocar esta función así:

  create policy movimientos_select on movimientos_financieros
    for select to authenticated using (
      puede_ver_nivel_financiero(nivel_sensibilidad, area_id, categoria, id)
    );

Parámetros:
  - p_nivel: nivel_sensibilidad de la fila (resumen/detalle/personal).
  - p_area_id: FK a areas.id de la fila. Necesario para que gestor_area solo
    vea "resumen" de SU PROPIA área: se compara contra usuario_areas del
    usuario que consulta via puede_ver_area(), sin recursión de RLS gracias a
    que ambas funciones son security definer.
  - p_categoria / p_registro_id: opcionales, solo se usan para nivel
    "personal". Pasar el id de la fila como p_registro_id y, si la tabla
    agrupa por categoría (ej. 'nomina'), su columna de categoría como
    p_categoria. Se validan contra finanzas_excepciones_acceso via
    tiene_excepcion_personal().

Esta función es de SOLO LECTURA (pensada para políticas de SELECT). Las
políticas de INSERT/UPDATE/DELETE de cada tabla financiera futura las define
db-architect junto con el esquema de esa tabla, pero deberían reusar estos
mismos bloques básicos (es_admin_global(), es_gestor_area(),
es_finanzas_operativo(), tiene_excepcion_personal()) en vez de repetir la
lógica de roles.$doc$;
