-- ============================================================================
-- Datos de perfil adicionales para `usuarios`, editables por cada quien
-- (RLS `usuarios_update_propio` ya permite update propio desde 20260701211633
-- init.sql — no hace falta tocar RLS acá).
-- ============================================================================

alter table usuarios add column if not exists telefono text;
alter table usuarios add column if not exists cargo text;

comment on column usuarios.telefono is 'Teléfono de contacto, editable por el propio usuario.';
comment on column usuarios.cargo is
  'Cargo/puesto dentro del equipo (texto libre, ej. "Coordinador comercial"). '
  'Distinto de rol_base, que es el nivel de permisos, no un título de puesto.';
