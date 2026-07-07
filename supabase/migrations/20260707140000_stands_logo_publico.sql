-- ============================================================================
-- Feria Effix 2026 — Link público de solo lectura por stand + carga de logo.
-- Autor lógico: db-architect / public-forms-builder
--
-- Cada stand tiene un token público (independiente del `id` interno) para
-- armar un link tipo /mi-stand/<token> que se le manda al cliente: ve toda
-- la info de SU stand en modo lectura y solo puede subir su logo. No se
-- reutiliza `id` como token para no exponer el identificador interno usado
-- en el resto del sistema (RLS, FKs, etc.) — así se puede rotar el link sin
-- tocar la fila real.
--
-- El logo se guarda en Supabase Storage (bucket `stands-logos`, público de
-- lectura). La escritura NUNCA pasa por RLS de storage.objects: el upload se
-- hace server-side con el cliente admin (service_role) desde una server
-- action que valida el token, igual que reservarStand/confirmarReserva en
-- /mapa-stands/actions.ts. Por eso no hace falta política de storage para
-- anon — el bucket es público solo para *lectura* de los archivos ya subidos.
-- ============================================================================

alter table stands
  add column if not exists token_publico uuid not null default gen_random_uuid();

-- Unique por separado (no en la misma línea) para poder usar
-- "add column if not exists" de forma idempotente sin chocar con la
-- constraint si la migración se corre más de una vez.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'stands_token_publico_key'
  ) then
    alter table stands add constraint stands_token_publico_key unique (token_publico);
  end if;
end $$;

alter table stands
  add column if not exists logo_url text;

comment on column stands.token_publico is
  'Token opaco para el link público de solo lectura del stand '
  '(/mi-stand/<token>). Independiente de `id`: no expone el identificador '
  'interno y se puede rotar (regenerar) sin afectar FKs ni RLS.';
comment on column stands.logo_url is
  'URL pública del logo del cliente en Supabase Storage (bucket '
  'stands-logos), cargado por el cliente desde su link público de solo '
  'lectura. Al cargarse, también se marca stands.logo_recibido = true.';

-- ---------- Bucket de Storage para los logos ---------------------------------
-- Público de LECTURA (para poder mostrarlo en el panel y en el link del
-- cliente sin firmar URLs); la escritura solo ocurre server-side con
-- service_role, nunca directo desde el navegador, así que no se necesita
-- ninguna política de storage.objects para anon/authenticated.
insert into storage.buckets (id, name, public)
values ('stands-logos', 'stands-logos', true)
on conflict (id) do nothing;
