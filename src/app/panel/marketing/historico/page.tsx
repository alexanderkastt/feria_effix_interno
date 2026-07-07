import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  HistoricoMarketing,
  type RegistroHistorico,
} from "@/components/panel/HistoricoMarketing";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "marketing");
  if (!sesion.esAdmin && !acceso) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("datos_historicos_marketing")
    .select(
      "id, campana, objetivo, alcance, gasto_cop, resultados, costo_por_resultado, ctr, cvr, fecha",
    )
    .order("gasto_cop", { ascending: false, nullsFirst: false })
    .limit(2000);

  return <HistoricoMarketing filas={(data ?? []) as RegistroHistorico[]} />;
}
