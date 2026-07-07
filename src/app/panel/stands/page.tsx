import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  StandsAdmin,
  type StandView,
  type PatrocinioOption,
} from "@/components/panel/StandsAdmin";

export const dynamic = "force-dynamic";

export default async function PanelStandsPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "stands");
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data: standsData } = await supabase
    .from("stands")
    .select(
      "id, codigo, nombre, tamano, precio, estado, cliente_nombre, patrocinador_id",
    )
    .order("codigo");
  const { data: patrociniosData } = await supabase
    .from("patrocinios")
    .select("id, empresa")
    .order("empresa");

  return (
    <StandsAdmin
      stands={(standsData ?? []) as StandView[]}
      patrocinios={(patrociniosData ?? []) as PatrocinioOption[]}
      puedeEditar={puedeEditar}
    />
  );
}
