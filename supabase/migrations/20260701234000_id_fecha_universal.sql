-- ============================================================================
-- Feria Effix 2026 — Garantizar ID único + fecha de creación en TODA tabla.
-- La mayoría ya lo tenía; esto cierra los pocos huecos (referencias y uniones).
-- ============================================================================

-- Tablas con id pero sin fecha de creación
alter table areas add column if not exists creado_en timestamptz not null default now();
alter table presupuesto_general add column if not exists creado_en timestamptz not null default now();
alter table contexto_evento add column if not exists creado_en timestamptz not null default now();

-- Tablas de unión (PK compuesta): agregar id único de fila + fecha.
-- La PK compuesta ya impide duplicados; el id da un identificador único por fila.
alter table usuario_areas add column if not exists id uuid not null default gen_random_uuid();
alter table usuario_areas add column if not exists creado_en timestamptz not null default now();
create unique index if not exists usuario_areas_id_uq on usuario_areas (id);

alter table audiencia_contactos add column if not exists id uuid not null default gen_random_uuid();
alter table audiencia_contactos add column if not exists creado_en timestamptz not null default now();
create unique index if not exists audiencia_contactos_id_uq on audiencia_contactos (id);
