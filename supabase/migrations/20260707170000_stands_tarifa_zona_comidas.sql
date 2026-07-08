-- ============================================================================
-- Feria Effix 2026 — Check manual de tarifa (comercial vs. zona de comidas)
-- independiente del pabellón físico del stand.
-- Autor lógico: db-architect
--
-- Hasta ahora la tarifa por m² se derivaba automáticamente de
-- `pabellon = 'zona_comidas'`. Eso no cubre casos reales donde un stand de
-- comidas queda ubicado fuera de esa zona (o viceversa). Se agrega un check
-- explícito y editable a mano, independiente del pabellón, para poder cargar
-- el valor real de cada stand sin importar en qué zona física esté parado.
--
-- Backfill: se inicializa en true para los stands que HOY están en
-- pabellon = 'zona_comidas' (mismo criterio que se usaba antes), para no
-- cambiar el precio de ningún stand ya cargado. De acá en adelante el check
-- es la fuente de verdad, no el pabellón.
-- ============================================================================

alter table stands
  add column if not exists tarifa_zona_comidas boolean not null default false;

update stands
  set tarifa_zona_comidas = true
  where pabellon = 'zona_comidas' and tarifa_zona_comidas = false;

comment on column stands.tarifa_zona_comidas is
  'Check manual: true = tarifa de zona de comidas ($400.000/m²), false = '
  'tarifa comercial estándar ($700.000/m²). Independiente de `pabellon` '
  '(un stand puede estar físicamente en una zona pero cobrar la tarifa de '
  'otra); se edita a mano desde el panel.';
