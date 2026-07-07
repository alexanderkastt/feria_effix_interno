import { notFound } from "next/navigation";
import { getArea } from "@/lib/areas";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  KanbanInteractive,
  type TareaView,
  type TransversalView,
} from "@/components/panel/KanbanInteractive";

export const dynamic = "force-dynamic";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ area: string }>;
}) {
  const { area } = await params;
  const meta = getArea(area);
  if (!meta) notFound();

  const sesion = await getSesion();
  if (!sesion) notFound(); // el layout ya redirige, defensa extra

  const acceso = sesion.areas.find((a) => a.slug === meta.slug);
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data: areaRow } = await supabase
    .from("areas")
    .select("id")
    .eq("nombre", meta.slug)
    .single();

  const { data: filas } = await supabase
    .from("tareas")
    .select(
      "id, titulo, estado, prioridad, fecha_limite, responsable:usuarios(nombre)",
    )
    .eq("area_id", areaRow!.id)
    .order("creado_en", { ascending: true });

  const tareas: TareaView[] = (filas ?? []).map((f) => ({
    id: f.id,
    titulo: f.titulo,
    estado: f.estado,
    prioridad: f.prioridad,
    fecha_limite: f.fecha_limite,
    responsable:
      (f.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  // Tareas transversales que involucran a esta área (RLS ya filtra visibilidad).
  const { data: transvFilas } = await supabase
    .from("tareas_transversales")
    .select("id, titulo, estado, prioridad")
    .contains("areas_involucradas", [areaRow!.id])
    .order("creado_en", { ascending: false });

  const transversales: TransversalView[] = (transvFilas ?? []).map((t) => ({
    id: t.id,
    titulo: t.titulo,
    estado: t.estado,
    prioridad: t.prioridad,
  }));

  return (
    <KanbanInteractive
      areaId={areaRow!.id}
      areaSlug={meta.slug}
      label={meta.label}
      tareas={tareas}
      puedeEditar={puedeEditar}
      transversales={transversales}
    />
  );
}
