-- ============================================================================
-- Feria Effix 2026 — Datos de contacto para el futuro Directorio de Marcas.
-- Autor lógico: db-architect
--
-- El cliente completa estos datos desde su link público (/mi-stand/[token]),
-- precargados con lo que ya existe (nombre, ciudad) para no pedirle de nuevo
-- lo que ya tenemos. Son datos PENSADOS PARA SER PÚBLICOS más adelante (el
-- directorio de marcas), a diferencia del resto de columnas comerciales de
-- `stands` (precios, pagos, observaciones internas), que siguen siendo
-- internas. Por eso van en columnas separadas y con prefijo `directorio_`, no
-- mezcladas con los campos de gestión comercial existentes.
--
-- REGLA DURA: no se toca ninguna columna existente de `stands`.
-- ============================================================================

alter table stands add column if not exists directorio_pais text;
alter table stands add column if not exists directorio_direccion text;
alter table stands add column if not exists directorio_telefono text;
alter table stands add column if not exists directorio_email text;
alter table stands add column if not exists directorio_sitio_web text;
alter table stands add column if not exists directorio_descripcion text;
-- Texto libre a propósito (puede traer varios links: Instagram, Facebook,
-- TikTok, etc.) en vez de una columna por red social.
alter table stands add column if not exists directorio_redes_sociales text;

comment on column stands.directorio_pais is
  'País de contacto para el futuro Directorio de Marcas público. Lo completa '
  'el cliente desde /mi-stand/[token]. Distinto de `ciudad` (que en el Excel '
  'original mezcla ciudad/país de forma inconsistente).';
comment on column stands.directorio_telefono is
  'Teléfono de contacto público para el Directorio de Marcas (no confundir '
  'con el teléfono interno de reserva en `cliente_telefono`).';
comment on column stands.directorio_email is
  'Email de contacto público para el Directorio de Marcas.';
comment on column stands.directorio_redes_sociales is
  'Texto libre con links de redes sociales de la marca (Instagram, Facebook, '
  'etc.), para el futuro Directorio de Marcas.';
