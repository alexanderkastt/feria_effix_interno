import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PatrociniosAdmin,
  type PatrocinioView,
} from "@/components/panel/PatrociniosAdmin";

export const dynamic = "force-dynamic";

export default async function PanelPatrociniosPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "patrocinios");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("patrocinios")
    .select(
      "id, empresa, tier, monto, estado_pago, entregables_pendientes, stand:stands!patrocinios_stand_fk(codigo)",
    )
    .order("monto", { ascending: false });

  const patrocinios: PatrocinioView[] = (data ?? []).map((p) => ({
    id: p.id,
    empresa: p.empresa,
    tier: p.tier,
    monto: p.monto,
    estado_pago: p.estado_pago,
    entregables_pendientes: p.entregables_pendientes,
    stand_codigo:
      (p.stand as unknown as { codigo: string } | null)?.codigo ?? null,
  }));

  return (
    <PatrociniosAdmin patrocinios={patrocinios} puedeEditar={puedeEditar} />
  );
}
