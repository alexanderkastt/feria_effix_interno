import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PonentesModulo,
  type PonenteView,
} from "@/components/panel/PonentesModulo";
import type {
  TareaView,
  TransversalView,
} from "@/components/panel/KanbanInteractive";

export const dynamic = "force-dynamic";

export default async function PonentesPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "ponentes");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();

  const { data: ponentesData } = await supabase
    .from("postulaciones_ponentes")
    .select(
      "id, nombre, email, telefono, cargo, empresa, ciudad_pais, foto_url, tema_propuesto, formato_participacion, experiencia_previa, bio, video_url, ig, tiktok, linkedin, facebook, youtube, notas_internas, estado, origen, creado_en",
    )
    .order("creado_en", { ascending: false });

  const { data: areaRow } = await supabase
    .from("areas")
    .select("id")
    .eq("nombre", "ponentes")
    .single();
  const areaId = areaRow?.id as string | undefined;

  const { data: tareasData } = await supabase
    .from("tareas")
    .select(
      "id, titulo, estado, prioridad, fecha_limite, responsable:usuarios(nombre)",
    )
    .eq("area_id", areaId ?? "")
    .order("creado_en", { ascending: true });

  const tareas: TareaView[] = (tareasData ?? []).map((f) => ({
    id: f.id,
    titulo: f.titulo,
    estado: f.estado,
    prioridad: f.prioridad,
    fecha_limite: f.fecha_limite,
    responsable:
      (f.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  let transversales: TransversalView[] = [];
  if (areaId) {
    const { data: tvData } = await supabase
      .from("tareas_transversales")
      .select("id, titulo, estado, prioridad")
      .contains("areas_involucradas", [areaId]);
    transversales = (tvData ?? []) as TransversalView[];
  }

  return (
    <PonentesModulo
      ponentes={(ponentesData ?? []) as PonenteView[]}
      puedeEditar={puedeEditar}
      areaId={areaId ?? ""}
      tareas={tareas}
      transversales={transversales}
    />
  );
}
