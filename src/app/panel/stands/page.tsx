import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StandsAdmin,
  type StandView,
  type PagoStandView,
  type AsesorOption,
  type HistorialEntradaView,
} from "@/components/panel/StandsAdmin";
import type { DevolucionView } from "@/components/panel/StandsDevoluciones";

export const dynamic = "force-dynamic";

export default async function PanelStandsPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "stands");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);
  // Datos comerciales (cliente, precios, pagos, fusiones): solo nivel 'admin'
  // del área o admin global. Más estricto que puedeEditar (checklist/estado).
  const puedeEditarComercial = sesion.esAdmin || acceso?.nivel === "admin";

  const supabase = await createClient();
  const [standsRes, pagosRes, devolucionesRes, asesoresRes, historialRes] =
    await Promise.all([
      supabase
        .from("stands")
        .select(
          `id, codigo, nombre, tamano, tarifa_zona_comidas, precio, estado,
           cliente_nombre, cliente_email, cliente_telefono,
           pabellon, tipo_stand, categoria_cliente, estado_venta, obsequio_de,
           valor_sin_iva, valor_con_iva, precio_venta,
           nombre_fiscal, nombre_persona_encargada, id_effi, ciudad,
           valor_primer_abono, medio_pago_primer_abono, forma_pago_restante, valor_restante,
           pantallazo_aceptacion, aprobacion_tesoreria, facturado, fecha_venta, numero_factura,
           primera_vez_en_feria,
           contrato_entregado, manual_entregado, logo_recibido, marcado_en_mapa, publicado_web,
           imagen_enviada, formulario_directorio_lleno, paz_y_salvo,
           observaciones_venta, observaciones_facturacion,
           asesor_id, asesores_comerciales(nombre_completo), stand_principal_id,
           token_publico, logo_url,
           directorio_pais, directorio_direccion, directorio_telefono,
           directorio_email, directorio_sitio_web, directorio_descripcion,
           directorio_instagram, directorio_facebook, directorio_tiktok,
           directorio_linkedin`,
        )
        .order("codigo"),
      supabase
        .from("pagos_stand")
        .select("id, stand_id, monto, fecha, medio_pago, tipo_pago")
        .order("fecha", { ascending: false }),
      supabase
        .from("stands_devoluciones")
        .select(
          `id, stand_id, pabellon, codigo, medida,
           valor_sin_iva, valor_con_iva, precio_venta,
           nombre_comercial, nombre_fiscal, nombre_persona_encargada,
           numero_contacto, id_effi, ciudad,
           valor_pagado_hasta_devolucion, medio_pago_primer_abono, forma_pago_restante,
           estado_devolucion, motivo, observaciones, fecha_devolucion`,
        )
        .order("fecha_devolucion", { ascending: false, nullsFirst: false }),
      supabase
        .from("asesores_comerciales")
        .select("id, nombre_completo")
        .eq("activo", true)
        .order("nombre_completo"),
      supabase
        .from("stands_historial")
        .select(
          "id, stand_id, campo, valor_anterior, valor_nuevo, creado_en, usuarios(nombre)",
        )
        .order("creado_en", { ascending: false })
        .limit(3000),
    ]);

  const stands: StandView[] = (standsRes.data ?? []).map((s) => ({
    ...s,
    asesor_nombre:
      (s.asesores_comerciales as unknown as { nombre_completo: string } | null)
        ?.nombre_completo ?? null,
  })) as unknown as StandView[];

  const historial: HistorialEntradaView[] = (historialRes.data ?? []).map(
    (h) => ({
      ...h,
      usuario_nombre:
        (h.usuarios as unknown as { nombre: string } | null)?.nombre ?? null,
    }),
  ) as unknown as HistorialEntradaView[];

  return (
    <StandsAdmin
      stands={stands}
      pagos={(pagosRes.data ?? []) as PagoStandView[]}
      devoluciones={(devolucionesRes.data ?? []) as DevolucionView[]}
      asesores={(asesoresRes.data ?? []) as AsesorOption[]}
      historial={historial}
      puedeEditar={puedeEditar}
      puedeEditarComercial={puedeEditarComercial}
    />
  );
}
