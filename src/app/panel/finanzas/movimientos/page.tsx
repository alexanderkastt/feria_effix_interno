import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  MovimientosFinanzas,
  type IngresoMovView,
  type EgresoMovView,
  type CategoriaOpcion,
} from "@/components/panel/MovimientosFinanzas";

export const dynamic = "force-dynamic";

export default async function PanelFinanzasMovimientosPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  // Mismo gate que el resto del proyecto para módulos con `listo: false`
  // (ver AREAS en @/lib/areas): hoy solo lo ve esRoot, más adelante quien
  // tenga acceso explícito al área "finanzas" en usuario_areas.
  const acceso = sesion.areas.find((a) => a.slug === "finanzas");
  if (!sesion.esRoot && !acceso) notFound();

  const supabase = await createClient();

  const [
    { data: ingresosData },
    { data: egresosData },
    { data: categoriasData },
  ] = await Promise.all([
    supabase
      .from("movimientos_ingresos")
      .select(
        "id, fecha_creacion, numero_factura, cliente_nombre, cliente_nit, concepto, total_bruto, descuentos, subtotal, impuestos, total_neto, origen, categoria_id, subido_a_effisystems, nivel_sensibilidad, revision_pendiente, nota_revision",
      )
      .order("fecha_creacion", { ascending: false }),
    supabase
      .from("movimientos_egresos")
      .select(
        "id, fecha, proveedor_nombre, descripcion_servicio, observaciones, rubro_agrupado, subrubro, valor_antes_iva, impuestos, retenciones, total_neto, numero_factura_proveedor, numero_comprobante_effi, lleva_factura_electronica, categoria_id, nivel_sensibilidad, revision_pendiente, nota_revision",
      )
      .order("fecha", { ascending: false }),
    supabase
      .from("categorias_presupuesto")
      .select("id, nombre, tipo")
      .order("nombre"),
  ]);

  // ---------------------------------------------------------------------
  // cliente_nit es nivel "personal" (más sensible que el resto de la fila,
  // ver comentario de la columna en la migración de esquema). RLS ya decide
  // qué FILAS puede ver el usuario, pero ocultar esta COLUMNA dentro de una
  // fila permitida es una decisión de la aplicación: se recorta ACÁ, en el
  // servidor, antes de construir el objeto que se serializa al componente
  // cliente. Si !sesion.esAdmin, la clave `cliente_nit` ni siquiera se
  // incluye en el objeto — no viaja en el payload del Server Component, no
  // hace falta ocultarla después con CSS ni con un `if` en el cliente.
  //
  // Los campos "de edición" (total_bruto, descuentos, subtotal, impuestos,
  // subido_a_effisystems, nivel_sensibilidad y sus equivalentes de egreso)
  // solo los usa el formulario de crear/editar, que a su vez SOLO se
  // renderiza si sesion.esAdmin (ver MovimientosFinanzas.tsx). Se recortan
  // del payload para no-admin por el mismo criterio que cliente_nit: no
  // viajan al cliente si no hace falta, aunque no sean tan sensibles.
  // ---------------------------------------------------------------------
  const ingresos: IngresoMovView[] = (ingresosData ?? []).map((m) => {
    const base = {
      id: m.id as string,
      fecha_creacion: m.fecha_creacion as string,
      numero_factura: m.numero_factura as string | null,
      cliente_nombre: m.cliente_nombre as string | null,
      concepto: m.concepto as string | null,
      total_neto: Number(m.total_neto ?? 0),
      origen: m.origen as IngresoMovView["origen"],
      categoria_id: m.categoria_id as string | null,
      revision_pendiente: Boolean(m.revision_pendiente),
      nota_revision: m.nota_revision as string | null,
    };
    return sesion.esAdmin
      ? {
          ...base,
          cliente_nit: (m.cliente_nit as string | null) ?? undefined,
          total_bruto: m.total_bruto == null ? null : Number(m.total_bruto),
          descuentos: m.descuentos == null ? null : Number(m.descuentos),
          subtotal: m.subtotal == null ? null : Number(m.subtotal),
          impuestos: m.impuestos == null ? null : Number(m.impuestos),
          subido_a_effisystems: Boolean(m.subido_a_effisystems),
          nivel_sensibilidad:
            m.nivel_sensibilidad as IngresoMovView["nivel_sensibilidad"],
        }
      : base;
  });

  const egresos: EgresoMovView[] = (egresosData ?? []).map((m) => {
    const base = {
      id: m.id as string,
      fecha: m.fecha as string | null,
      proveedor_nombre: m.proveedor_nombre as string | null,
      rubro_agrupado: m.rubro_agrupado as string | null,
      subrubro: m.subrubro as string | null,
      total_neto: Number(m.total_neto ?? 0),
      numero_factura_proveedor: m.numero_factura_proveedor as string | null,
      revision_pendiente: Boolean(m.revision_pendiente),
      nota_revision: m.nota_revision as string | null,
    };
    return sesion.esAdmin
      ? {
          ...base,
          descripcion_servicio: m.descripcion_servicio as string | null,
          observaciones: m.observaciones as string | null,
          valor_antes_iva:
            m.valor_antes_iva == null ? null : Number(m.valor_antes_iva),
          impuestos: m.impuestos == null ? null : Number(m.impuestos),
          retenciones: m.retenciones == null ? null : Number(m.retenciones),
          numero_comprobante_effi: m.numero_comprobante_effi as string | null,
          lleva_factura_electronica: Boolean(m.lleva_factura_electronica),
          categoria_id: m.categoria_id as string | null,
          nivel_sensibilidad:
            m.nivel_sensibilidad as EgresoMovView["nivel_sensibilidad"],
        }
      : base;
  });

  const categorias: CategoriaOpcion[] = (categoriasData ?? []).map((c) => ({
    id: c.id as string,
    nombre: c.nombre as string,
    tipo: c.tipo as CategoriaOpcion["tipo"],
  }));

  // Suma de total_neto de las filas en revisión, calculada en el servidor
  // sobre el conjunto completo que RLS le permitió ver a este usuario (no
  // depende de los filtros que aplique después en el cliente).
  const sumaRevisionIngresos = ingresos
    .filter((m) => m.revision_pendiente)
    .reduce((s, m) => s + m.total_neto, 0);
  const sumaRevisionEgresos = egresos
    .filter((m) => m.revision_pendiente)
    .reduce((s, m) => s + m.total_neto, 0);

  return (
    <MovimientosFinanzas
      ingresos={ingresos}
      egresos={egresos}
      categorias={categorias}
      sumaRevisionIngresos={sumaRevisionIngresos}
      sumaRevisionEgresos={sumaRevisionEgresos}
      esAdmin={sesion.esAdmin}
    />
  );
}
