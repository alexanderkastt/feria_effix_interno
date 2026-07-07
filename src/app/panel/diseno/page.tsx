import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREAS } from "@/lib/areas";
import {
  PipelineDiseno,
  type SolicitudView,
} from "@/components/panel/PipelineDiseno";

export const dynamic = "force-dynamic";

export default async function DisenoPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "diseno");
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes_diseno")
    .select(
      "id, titulo, tipo_pieza, prioridad, etapa, fecha_limite, solicitante:areas(nombre)",
    )
    .order("creado_en");

  const solicitudes: SolicitudView[] = (data ?? []).map((s) => ({
    id: s.id,
    titulo: s.titulo,
    tipo_pieza: s.tipo_pieza,
    prioridad: s.prioridad,
    etapa: s.etapa,
    fecha_limite: s.fecha_limite,
    solicitante:
      (s.solicitante as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  const { data: areasDb } = await supabase.from("areas").select("id, nombre");
  const labelDe = (nombre: string) =>
    AREAS.find((a) => a.slug === nombre)?.label ?? nombre;
  const areas = (areasDb ?? []).map((a) => ({
    id: a.id,
    label: labelDe(a.nombre),
  }));

  return (
    <PipelineDiseno
      solicitudes={solicitudes}
      areas={areas}
      puedeEditar={puedeEditar}
    />
  );
}
