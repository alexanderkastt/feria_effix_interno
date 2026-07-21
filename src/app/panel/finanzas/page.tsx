import { notFound, redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

// La pantalla vieja de este dashboard (ingresos/gastos/presupuesto_general,
// el "MVP genérico" de un prompt anterior) se eliminó el 2026-07-11 junto con
// sus tablas — reemplazada por completo por presupuesto/movimientos/venue.
// /panel/finanzas ahora solo redirige a la vista real por defecto.
export default async function PanelFinanzasPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "finanzas");
  if (!sesion.esRoot && !acceso) notFound();

  redirect("/panel/finanzas/presupuesto");
}
