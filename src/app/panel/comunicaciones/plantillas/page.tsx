import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  PlantillasEmailView,
  type PlantillaRow,
} from "@/components/panel/PlantillasEmailView";

export const dynamic = "force-dynamic";

export default async function PlantillasPage() {
  const sesion = await getSesion();
  const ok =
    sesion &&
    (sesion.esAdmin || sesion.areas.some((a) => a.slug === "marketing"));
  if (!ok) notFound();
  const puedeEditar =
    sesion.esAdmin ||
    sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura");

  const supabase = await createClient();
  const [{ data }, { data: areasRows }] = await Promise.all([
    supabase
      .from("plantillas_email")
      .select(
        "id, nombre, asunto, contenido_html, contenido_texto, es_transaccional, area_relacionada",
      )
      .order("creado_en", { ascending: false }),
    supabase.from("areas").select("id, nombre"),
  ]);

  const areas = (areasRows ?? []).map((a) => ({
    id: a.id as string,
    label: AREA_LABEL[a.nombre as AreaSlug] ?? (a.nombre as string),
  }));

  return (
    <PlantillasEmailView
      plantillas={(data ?? []) as PlantillaRow[]}
      areas={areas}
      puedeEditar={puedeEditar}
    />
  );
}
