import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StandsAdmin,
  type StandView,
  type PatrocinioOption,
  type PagoStandView,
  type AsesorOption,
} from "@/components/panel/StandsAdmin";
import type { DevolucionView } from "@/components/panel/StandsDevoluciones";

export const dynamic = "force-dynamic";

export default async function PanelStandsPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "stands");
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);
  // Datos comerciales (cliente, precios, pagos, fusiones): solo nivel 'admin'
  // del área o admin global. Más estricto que puedeEditar (checklist/estado).
  const puedeEditarComercial = sesion.esAdmin || acceso?.nivel === "admin";

  const supabase = await createClient();
  const [standsRes, patrociniosRes, pagosRes, devolucionesRes, asesoresRes] =
    await Promise.all([
      supabase
        .from("stands")
        .select(
          `id, codigo, nombre, tamano, precio, estado, cliente_nombre, patrocinador_id,
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
           token_publico, logo_url`,
        )
        .order("codigo"),
      supabase.from("patrocinios").select("id, empresa").order("empresa"),
      supabase
        .from("pagos_stand")
        .select("id, stand_id, monto, fecha, medio_pago, tipo_pago")
        .order("fecha", { ascending: false }),
      supabase
        .from("stands_devoluciones")
        .select(
          "id, stand_id, pabellon, codigo, valor_pagado_hasta_devolucion, estado_devolucion, motivo, observaciones, fecha_devolucion",
        )
        .order("fecha_devolucion", { ascending: false, nullsFirst: false }),
      supabase
        .from("asesores_comerciales")
        .select("id, nombre_completo")
        .eq("activo", true)
        .order("nombre_completo"),
    ]);

  const stands: StandView[] = (standsRes.data ?? []).map((s) => ({
    ...s,
    asesor_nombre:
      (s.asesores_comerciales as unknown as { nombre_completo: string } | null)
        ?.nombre_completo ?? null,
  })) as unknown as StandView[];

  return (
    <StandsAdmin
      stands={stands}
      patrocinios={(patrociniosRes.data ?? []) as PatrocinioOption[]}
      pagos={(pagosRes.data ?? []) as PagoStandView[]}
      devoluciones={(devolucionesRes.data ?? []) as DevolucionView[]}
      asesores={(asesoresRes.data ?? []) as AsesorOption[]}
      puedeEditar={puedeEditar}
      puedeEditarComercial={puedeEditarComercial}
    />
  );
}
