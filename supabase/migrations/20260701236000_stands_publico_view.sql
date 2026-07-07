-- ============================================================================
-- Feria Effix 2026 — Ampliación de la vista pública `stands_publico` para el
-- mapa público (/mapa-stands).
-- Autor lógico: db-architect
--
-- Contexto: `stands` fue ampliada en 20260701235000_stands_reales.sql con
-- columnas comerciales/PII internas (nombre_fiscal, cliente_*, valores de
-- venta, etc.). Esa migración dejó explícitamente sin tocar `stands_publico`
-- (ver nota final de ese archivo) porque la mayoría de lo nuevo no es apto
-- para el público. Esta migración expone SOLO 3 columnas nuevas que no son
-- PII ni datos comerciales sensibles:
--   - pabellon       -> zona física del stand, dato público (selector de zona)
--   - tipo_stand     -> isla/tipo_u/esquinero/lineal, dato público (detalle)
--   - valor_con_iva  -> precio real con IVA que paga el cliente; el mapa
--                       público debe mostrar precio CON IVA, no el `precio`
--                       genérico (que puede no reflejar el valor con IVA real)
--
-- Además, esta migración agrega el filtro `where habilitado = true`: los
-- stands no habilitados NO deben ser visibles ni seleccionables en el mapa
-- público en absoluto (no alcanza con exponer/ocultar la columna en el
-- frontend, se filtra en la vista misma).
--
-- REGLA DURA: no se renombra ni se elimina ninguna columna existente de
-- `stands_publico` (id, codigo, nombre, tamano, precio, estado,
-- bloqueado_hasta). Solo se agregan columnas nuevas al final.
-- ============================================================================

create or replace view stands_publico as
  select
    id, codigo, nombre, tamano, precio, estado, bloqueado_hasta,
    pabellon, tipo_stand, valor_con_iva
  from stands
  where habilitado = true;

-- ---------- Grant ------------------------------------------------------------
-- Nota de verificación: `create or replace view` conserva el ACL (grants)
-- existente del objeto siempre que se mantenga el mismo nombre y no se
-- quiten/renombren/reordenen columnas ya existentes (solo se agregan al
-- final) — no es un DROP + CREATE, así que el grant original
-- (`grant select on stands_publico to anon, authenticated;`, de
-- 20260701221332_stands_patrocinios.sql) sigue vigente sin necesidad de
-- repetirlo. Se repite igual acá, de forma idempotente, como documentación
-- explícita y defensa en profundidad por si la vista llegara a recrearse
-- alguna vez con DROP + CREATE.
grant select on stands_publico to anon, authenticated;
