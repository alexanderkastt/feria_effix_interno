-- ============================================================================
-- Finanzas (Bloque B, fix) — flag de "pendiente de revisión" para movimientos
-- reales, en AMBAS tablas (movimientos_ingresos y movimientos_egresos).
--
-- Disparador puntual: la factura FE-2080 (MUNDO FIT COLOMBIA S.A.S.) aparece
-- DOS veces en el Excel origen con el mismo monto y concepto — posible
-- duplicado de captura, o dos cargos reales distintos. El usuario decidió NO
-- borrar ninguna fila todavía, sino marcarlas como pendientes de revisión
-- hasta confirmar con el equipo/Effisystems. Esta migración solo agrega el
-- mecanismo (columnas); el UPDATE puntual de las 2 filas de FE-2080 lo hace
-- el usuario por separado, con el texto exacto que decida para nota_revision.
--
-- Se revisó el esquema de ambas tablas antes de este cambio: ninguna tenía ya
-- un flag booleano equivalente (movimientos_egresos sí tiene `observaciones`
-- text genérica, pero ningún booleano de estado de revisión en ninguna de
-- las dos).
--
-- Alcance: se agrega a AMBAS tablas, no solo a movimientos_ingresos. Mismo
-- criterio ya aplicado con `subido_a_effisystems` (20260710250000): esta duda
-- de calidad de datos (registro repetido / a confirmar) es igual de probable
-- en la hoja de egresos que en la de ingresos, y agregar la columna ahora
-- evita otra migración de ALTER la próxima vez que aparezca un caso así en
-- egresos.
--
-- Estas columnas son un flag operativo normal, igual que
-- subido_a_effisystems: se gobiernan por el nivel_sensibilidad de la fila
-- entera (vía puede_ver_nivel_financiero(), ya definida en
-- 20260710220000_finanzas_permisos.sql). No requieren política de RLS propia
-- ni tocar las ya existentes en ninguna de las dos tablas.
-- ============================================================================

alter table movimientos_ingresos
  add column revision_pendiente boolean not null default false,
  add column nota_revision text;

comment on column movimientos_ingresos.revision_pendiente is
  'true si esta fila quedó marcada para revisión manual (ej. posible '
  'duplicado de captura en el Excel origen, dato dudoso a confirmar con el '
  'equipo/Effisystems) — no implica que el dato esté mal, solo que alguien '
  'debe confirmarlo antes de darlo por definitivo. Flag operativo normal: se '
  'gobierna por el nivel_sensibilidad de la fila entera, igual que '
  'subido_a_effisystems — no tiene control de acceso propio.';

comment on column movimientos_ingresos.nota_revision is
  'Nullable. Texto libre con el motivo de la revisión pendiente (ej. '
  '"posible duplicado de FE-2080, mismo monto y concepto repetido en el '
  'Excel origen — a confirmar"). Sin uso definido si revision_pendiente es '
  'false.';

alter table movimientos_egresos
  add column revision_pendiente boolean not null default false,
  add column nota_revision text;

comment on column movimientos_egresos.revision_pendiente is
  'Mismo mecanismo que movimientos_ingresos.revision_pendiente, agregado acá '
  'por simetría (mismo criterio que subido_a_effisystems): la misma duda de '
  'calidad de datos de un Excel origen (posible duplicado, registro a '
  'confirmar) puede aparecer en egresos, no solo en ingresos. No se usa '
  'todavía para ningún dato cargado en producción.';

comment on column movimientos_egresos.nota_revision is
  'Nullable. Texto libre con el motivo de la revisión pendiente. Sin uso '
  'definido si revision_pendiente es false.';
