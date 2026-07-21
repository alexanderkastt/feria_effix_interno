    -- ============================================================================
    -- Finanzas — elimina el esquema viejo "MVP genérico" (ingresos/gastos/
    -- presupuesto_general), ya reemplazado por completo por el módulo real
    -- (categorias_presupuesto, lineas_presupuesto, movimientos_ingresos,
    -- movimientos_egresos, escenarios_venue, espacios_venue,
    -- escenario_venue_espacios).
    --
    -- Decisión explícita del usuario (2026-07-11): la pantalla /panel/finanzas
    -- vieja no se usa y se elimina. Las 3 tablas están vacías (0 filas cada una,
    -- verificado), así que no hay datos que migrar ni perder.
    --
    -- IMPORTANTE: había dos triggers activos escribiendo en `ingresos` desde
    -- Stands y Patrocinios (stands_ingreso_trg, patrocinios_ingreso_trg) — nunca
    -- se habían disparado porque los stands/patrocinios ya vendidos se cargaron
    -- por INSERT directo, no por UPDATE. Si no se borran ANTES de dropear
    -- `ingresos`, la próxima vez que alguien marque un stand como vendido o un
    -- patrocinio como pagado desde la interfaz, el UPDATE fallaría con un error
    -- de tabla inexistente. Se borran acá, junto con el trigger de notificación
    -- de `gastos` (notif_gasto_pendiente) — ninguno de los tres tiene reemplazo
    -- en el esquema nuevo (el usuario decidió eliminar, no extender).
    -- ============================================================================

    drop trigger if exists stands_ingreso_trg on stands;
    drop trigger if exists patrocinios_ingreso_trg on patrocinios;
    drop trigger if exists notif_gasto_pendiente on gastos;

    drop function if exists ingreso_por_stand();
    drop function if exists ingreso_por_patrocinio();
    drop function if exists trg_notif_gasto();

    drop table if exists ingresos;
    drop table if exists gastos;
    drop table if exists presupuesto_general;
