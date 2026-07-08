-- ============================================================================
-- Feria Effix 2026 — Reemplaza el campo único `directorio_redes_sociales`
-- (texto libre) por una columna por cada red social, para el Directorio de
-- Marcas. Autor lógico: db-architect
--
-- Se verificó antes de escribir esta migración que ningún stand tenía datos
-- cargados todavía en `directorio_redes_sociales` (la sección del formulario
-- se lanzó hace muy poco), así que se puede reemplazar sin migrar datos.
-- ============================================================================

alter table stands drop column if exists directorio_redes_sociales;

alter table stands add column if not exists directorio_instagram text;
alter table stands add column if not exists directorio_facebook text;
alter table stands add column if not exists directorio_tiktok text;
alter table stands add column if not exists directorio_linkedin text;

comment on column stands.directorio_instagram is
  'Usuario o link de Instagram de la marca, para el Directorio de Marcas.';
comment on column stands.directorio_facebook is
  'Usuario o link de Facebook de la marca, para el Directorio de Marcas.';
comment on column stands.directorio_tiktok is
  'Usuario o link de TikTok de la marca, para el Directorio de Marcas.';
comment on column stands.directorio_linkedin is
  'Usuario o link de LinkedIn de la marca, para el Directorio de Marcas.';
