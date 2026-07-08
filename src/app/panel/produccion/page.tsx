import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PipelineProduccion,
  type ItemView,
} from "@/components/panel/PipelineProduccion";

export const dynamic = "force-dynamic";

export default async function ProduccionPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "produccion");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("items_produccion")
    .select(
      "id, descripcion, categoria, etapa, proveedor, costo_estimado, costo_real",
    )
    .order("creado_en", { ascending: true });

  return (
    <PipelineProduccion
      items={(data ?? []) as ItemView[]}
      puedeEditar={puedeEditar}
    />
  );
}
