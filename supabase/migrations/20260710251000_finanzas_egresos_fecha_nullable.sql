-- ============================================================================
-- Finanzas (Bloque B, fix) — movimientos_egresos.fecha debe ser nullable.
--
-- La tabla se aplicó en producción con `fecha date not null`, antes de que se
-- corrigiera el archivo de migración para reflejar la decisión del usuario de
-- migrar las 617 filas completas de la hoja "Egresos" (Bloque C), incluidas
-- las 304 que están totalmente vacías (sin fecha). Este ALTER puntual ajusta
-- la tabla ya creada sin necesidad de recrearla.
-- ============================================================================

alter table movimientos_egresos alter column fecha drop not null;
