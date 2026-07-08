import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PipelineVideo,
  type PiezaView,
} from "@/components/panel/PipelineVideo";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "video");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("piezas_video")
    .select("id, titulo, tipo, etapa, fecha_publicacion_objetivo")
    .order("creado_en");

  const piezas: PiezaView[] = (data ?? []) as PiezaView[];

  return <PipelineVideo piezas={piezas} puedeEditar={puedeEditar} />;
}
