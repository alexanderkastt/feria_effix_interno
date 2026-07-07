import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ContextoEditor,
  type ContextoRow,
} from "@/components/panel/ContextoEditor";

export const dynamic = "force-dynamic";

export default async function ContextoPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  if (!sesion.esAdmin) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("contexto_evento")
    .select(
      "fecha_inicio, fecha_fin, ubicacion, meta_asistencia, precio_boleta, google_ads_id, ga4_id, gtm_id, meta_pixel_id, notas",
    )
    .eq("edicion", "2026")
    .maybeSingle();

  return <ContextoEditor contexto={(data ?? null) as ContextoRow | null} />;
}
