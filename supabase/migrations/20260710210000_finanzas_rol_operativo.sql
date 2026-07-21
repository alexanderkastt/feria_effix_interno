-- ============================================================================
-- Finanzas (Bloque 0) — nuevo rol `finanzas_operativo` en el enum rol_base.
-- Autor lógico: auth-rbac-builder.
--
-- Migración separada a propósito: Postgres no permite usar un valor de enum
-- recién agregado (ALTER TYPE ... ADD VALUE) dentro de la misma transacción
-- en la que se agregó. La lógica que sí referencia 'finanzas_operativo'
-- (funciones RLS, comparaciones) vive en la migración siguiente
-- (20260710220000_finanzas_permisos.sql), que corre en su propia transacción.
--
-- IMPORTANTE — el rol se crea en el esquema pero NO se asigna a nadie:
-- el dueño de la plataforma confirmó explícitamente "nadie más por ahora".
-- No hay ningún UPDATE de usuarios en esta migración ni en la siguiente.
-- ============================================================================

alter type rol_base add value if not exists 'finanzas_operativo';
