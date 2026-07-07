-- ============================================================================
-- Alinear los tiers de patrocinio con los reales de feriaeffix.com.
-- Reales (según /patrocinadores/): Black, Platino, Diamante, Oro, Plata, Bronce.
-- La migración inicial solo tenía platino/diamante/oro/bronce.
-- ============================================================================
alter type tier_patrocinio add value if not exists 'black';
alter type tier_patrocinio add value if not exists 'plata';
