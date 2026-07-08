import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DecisionesBitacora,
  type DecisionView,
} from "@/components/panel/DecisionesBitacora";

export const dynamic = "force-dynamic";

export default async function EstrategiaPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "estrategia");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("decisiones_estrategicas")
    .select(
      "id, titulo, contexto, decision_tomada, fecha, tags, responsable:usuarios(nombre)",
    )
    .order("fecha", { ascending: false });

  const decisiones: DecisionView[] = (data ?? []).map((d) => ({
    id: d.id,
    titulo: d.titulo,
    contexto: d.contexto,
    decision_tomada: d.decision_tomada,
    fecha: d.fecha,
    tags: d.tags ?? [],
    responsable:
      (d.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  return (
    <DecisionesBitacora decisiones={decisiones} puedeEditar={puedeEditar} />
  );
}
