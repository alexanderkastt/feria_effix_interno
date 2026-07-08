import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  TransversalesView,
  type TransversalItem,
  type AreaOpcion,
} from "@/components/panel/TransversalesView";

export const dynamic = "force-dynamic";

export default async function TransversalesPage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  const supabase = await createClient();

  const { data: areasDb } = await supabase.from("areas").select("id, nombre");
  const labelPorId = new Map(
    (areasDb ?? []).map((a) => [a.id, AREA_LABEL[a.nombre as AreaSlug]]),
  );

  // Áreas donde el usuario puede crear transversales (edición o admin).
  const editableSlugs = new Set(
    sesion.areas.filter((a) => a.nivel !== "lectura").map((a) => a.slug),
  );
  const areaOpciones: AreaOpcion[] = (areasDb ?? [])
    .filter((a) => sesion.esRoot || editableSlugs.has(a.nombre))
    .map((a) => ({ id: a.id, label: AREA_LABEL[a.nombre as AreaSlug] }));

  const { data: filas } = await supabase
    .from("tareas_transversales")
    .select("id, titulo, descripcion, estado, prioridad, areas_involucradas")
    .order("creado_en", { ascending: false });

  const tareas: TransversalItem[] = (filas ?? []).map((t) => ({
    id: t.id,
    titulo: t.titulo,
    descripcion: t.descripcion,
    estado: t.estado,
    prioridad: t.prioridad,
    areas: ((t.areas_involucradas as string[] | null) ?? [])
      .map((aid) => labelPorId.get(aid))
      .filter((x): x is string => !!x),
  }));

  return (
    <TransversalesView
      tareas={tareas}
      areaOpciones={areaOpciones}
      puedeCrear={areaOpciones.length > 0}
    />
  );
}
