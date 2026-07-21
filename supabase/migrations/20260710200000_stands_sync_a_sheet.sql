-- ============================================================================
-- Dispara la Edge Function sync-stand-to-sheet cada vez que cambia en
-- `stands` alguno de los campos que también viven en el Google Sheet de
-- control, para mantener el Sheet al día sin que nadie tenga que copiar
-- nada a mano. Complementa a sync-stand-from-sheet (Sheet -> Plataforma).
--
-- Requiere:
--   1. Extensión pg_net habilitada (para hacer el POST sin bloquear el UPDATE).
--   2. El secreto de sincronización guardado como setting de la base
--      (mismo valor que SHEET_SYNC_SECRET en los secrets de Edge Functions).
--   3. Los secrets GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
--      y GOOGLE_SHEET_ID configurados en la Edge Function sync-stand-to-sheet.
-- ============================================================================
create extension if not exists pg_net with schema extensions;

-- OJO: reemplazar '<PEGAR-EL-MISMO-SECRETO-QUE-SHEET_SYNC_SECRET>' antes de
-- correr esta migración.
alter database postgres set app.sync_secret = '<PEGAR-EL-MISMO-SECRETO-QUE-SHEET_SYNC_SECRET>';

create or replace function trg_stands_sync_a_sheet()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://hidkhplgahoiusfxfrzi.supabase.co/functions/v1/sync-stand-to-sheet',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Sync-Secret', current_setting('app.sync_secret', true)
    ),
    body := jsonb_build_object(
      'codigo', new.codigo,
      'pabellon', new.pabellon,
      'tamano', new.tamano,
      'tipo_stand', new.tipo_stand,
      'valor_sin_iva', new.valor_sin_iva,
      'valor_con_iva', new.valor_con_iva,
      'precio_venta', new.precio_venta,
      'nombre', new.nombre,
      'nombre_fiscal', new.nombre_fiscal,
      'nombre_persona_encargada', new.nombre_persona_encargada,
      'directorio_telefono', new.directorio_telefono,
      'id_effi', new.id_effi,
      'ciudad', new.ciudad,
      'categoria_cliente', new.categoria_cliente,
      'asesor_id', new.asesor_id,
      'estado_venta', new.estado_venta,
      'medio_pago_primer_abono', new.medio_pago_primer_abono,
      'forma_pago_restante', new.forma_pago_restante,
      'pantallazo_aceptacion', new.pantallazo_aceptacion,
      'aprobacion_tesoreria', new.aprobacion_tesoreria,
      'fecha_venta', new.fecha_venta,
      'observaciones_venta', new.observaciones_venta,
      'primera_vez_en_feria', new.primera_vez_en_feria,
      'facturado', new.facturado,
      'numero_factura', new.numero_factura,
      'observaciones_facturacion', new.observaciones_facturacion,
      'contrato_entregado', new.contrato_entregado,
      'manual_entregado', new.manual_entregado,
      'logo_recibido', new.logo_recibido,
      'marcado_en_mapa', new.marcado_en_mapa,
      'publicado_web', new.publicado_web,
      'imagen_enviada', new.imagen_enviada,
      'formulario_directorio_lleno', new.formulario_directorio_lleno,
      'paz_y_salvo', new.paz_y_salvo
    )
  );
  return new;
end;
$$;

-- "update of" con esta lista puntual de columnas: el trigger NO se dispara
-- si solo cambian columnas fuera de esta lista (ej. cuando el trigger de
-- recalcular_valor_restante_stand toca valor_restante, o cuando cambia
-- cliente_nombre/cliente_email/cliente_telefono del flujo público, que no
-- viven en el Sheet).
create trigger stands_sync_a_sheet
  after update of
    pabellon, tamano, tipo_stand, valor_sin_iva, valor_con_iva, precio_venta,
    nombre, nombre_fiscal, nombre_persona_encargada, directorio_telefono,
    id_effi, ciudad, categoria_cliente, asesor_id, estado_venta,
    medio_pago_primer_abono, forma_pago_restante, pantallazo_aceptacion,
    aprobacion_tesoreria, fecha_venta, observaciones_venta,
    primera_vez_en_feria, facturado, numero_factura,
    observaciones_facturacion, contrato_entregado, manual_entregado,
    logo_recibido, marcado_en_mapa, publicado_web, imagen_enviada,
    formulario_directorio_lleno, paz_y_salvo
  on stands
  for each row execute function trg_stands_sync_a_sheet();
