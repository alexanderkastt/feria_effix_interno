-- ============================================================================
-- Feria Effix 2026 — Quita el vínculo stands.patrocinador_id (sin uso real:
-- 0 stands vinculados, tabla `patrocinios` vacía en el momento de esta
-- migración). Autor lógico: db-architect
--
-- OJO: esto NO toca la tabla `patrocinios` en sí ni su columna `stand_id`
-- (relación inversa patrocinios -> stands, `patrocinios_stand_fk`), que sí
-- está en uso real por el módulo /panel/patrocinios (que muestra en qué
-- stand está cada patrocinador). Son dos relaciones redundantes en
-- direcciones opuestas que quedaron del diseño original; se elimina la que
-- no se usa (`stands.patrocinador_id`), no la que sí.
-- ============================================================================

alter table stands drop constraint if exists stands_patrocinador_fk;
alter table stands drop column if exists patrocinador_id;
