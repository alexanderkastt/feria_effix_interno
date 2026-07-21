-- ============================================================================
-- Finanzas — documenta como INTENCIONAL (no como bug pendiente) el
-- comportamiento de puede_ver_area(null) dentro de puede_ver_nivel_financiero.
--
-- Confirmado con el dueño de la plataforma tras una prueba real de RLS (QA con
-- un usuario gestor_area real, sin finanzas_operativo/directivo/administrativo):
-- las categorías/líneas de presupuesto SIN área asignada (costos transversales
-- como Plaza Mayor, Impuesto, Fijos, Variables) deben seguir siendo visibles
-- SOLO para directivo, administrativo y finanzas_operativo — NUNCA para
-- gestor_area, sin importar qué área tenga asignada. No cambiar esta lógica.
-- ============================================================================

comment on function puede_ver_area(uuid) is
  'true si el usuario autenticado es admin global, o si tiene acceso explícito '
  'al área p_area vía usuario_areas. NOTA INTENCIONAL: si p_area es null, la '
  'comparación "area_id = p_area" en la subquery nunca matchea (semántica '
  'estándar de SQL para NULL), así que esta función devuelve false para '
  'cualquier gestor_area cuando p_area es null. Esto es DELIBERADO, no un bug: '
  'los costos/líneas financieras sin área asignada (transversales, ej. Plaza '
  'Mayor, Impuesto, Fijos, Variables) deben quedar reservados a '
  'es_admin_global()/es_finanzas_operativo(), nunca visibles a gestor_area '
  'aunque tenga acceso a otra área. Confirmado explícitamente con el dueño de '
  'la plataforma tras una prueba real de RLS (2026-07) — no "corregir" este '
  'comportamiento asumiendo que area_id null debería tratarse como público.';

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
lógica de roles.

NOTA INTENCIONAL sobre el branch 'resumen' cuando p_area_id es null: NO es un
bug pendiente de arreglar. puede_ver_area(null) siempre devuelve false para
gestor_area (ver comentario de esa función) — a propósito, para que los
costos/líneas transversales sin área asignada (Plaza Mayor, Impuesto, Fijos,
Variables, etc.) nunca sean visibles para gestor_area, sin importar qué área
tenga asignada. Confirmado explícitamente con el dueño de la plataforma tras
una prueba real de RLS (2026-07) — no agregar un "or p_area_id is null" acá
asumiendo que sería más consistente con categorias_presupuesto_select (esa
policy sí muestra el NOMBRE de la categoría transversal a cualquier
gestor_area — ver comment on policy categorias_presupuesto_select, es una
asimetría CONFIRMADA como intencional, no un descuido).$doc$;

comment on policy categorias_presupuesto_select on categorias_presupuesto is
  'Asimetría CONFIRMADA como intencional (2026-07, con el dueño de la '
  'plataforma) frente a lineas_presupuesto/puede_ver_nivel_financiero: acá '
  'gestor_area SÍ ve el nombre de una categoría transversal sin área asignada '
  '(ej. "Plaza mayor", "Impuesto", "Fijos", "Variables") vía el "or area_id '
  'is null" de abajo — es bajo riesgo porque es solo un nombre de categoría, '
  'sin ningún monto. Los MONTOS de esas categorías (en lineas_presupuesto) '
  'siguen invisibles para gestor_area sin importar su área, por diseño (ver '
  'comment on function puede_ver_area). No "corregir" quitando el "or area_id '
  'is null" de acá para que coincida con lineas_presupuesto — el usuario '
  'confirmó explícitamente que prefiere dejarlo así.';
