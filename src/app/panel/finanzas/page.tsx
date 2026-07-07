import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  FinanzasDashboard,
  type IngresoRow,
  type GastoRow,
  type PresupuestoRow,
  type AreaOpcion,
} from "@/components/panel/FinanzasDashboard";

export const dynamic = "force-dynamic";

export default async function PanelFinanzasPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "finanzas");
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();

  const [{ data: ingresosData }, { data: gastosData }, { data: presData }] =
    await Promise.all([
      supabase
        .from("ingresos")
        .select("id, fuente, concepto, monto, estado, fecha")
        .order("fecha", { ascending: false }),
      supabase
        .from("gastos")
        .select(
          "id, categoria, concepto, monto, proveedor, estado, area:areas(nombre)",
        )
        .order("creado_en", { ascending: false }),
      supabase
        .from("presupuesto_general")
        .select("id, categoria, monto_asignado"),
    ]);

  const ingresos = (ingresosData ?? []) as IngresoRow[];
  const gastos: GastoRow[] = (gastosData ?? []).map((g) => ({
    id: g.id,
    categoria: g.categoria,
    concepto: g.concepto,
    monto: Number(g.monto),
    proveedor: g.proveedor,
    estado: g.estado,
    area: (g.area as unknown as { nombre: AreaSlug } | null)?.nombre ?? null,
  }));
  const presupuesto = (presData ?? []) as PresupuestoRow[];

  // Áreas donde el usuario puede solicitar un gasto.
  const areasEditables: AreaOpcion[] = sesion.areas
    .filter((a) => sesion.esAdmin || a.nivel !== "lectura")
    .map((a) => ({ slug: a.slug, label: AREA_LABEL[a.slug] }));

  return (
    <FinanzasDashboard
      ingresos={ingresos}
      gastos={gastos}
      presupuesto={presupuesto}
      areasEditables={areasEditables}
      esAdmin={sesion.esAdmin}
      puedeEditar={puedeEditar}
    />
  );
}
