import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { whatsappConfigurado } from "@/lib/whatsapp";
import {
  WhatsappView,
  type PlantillaWa,
  type CampanaWa,
  type AudienciaOpt,
} from "@/components/panel/WhatsappView";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const sesion = await getSesion();
  const ok =
    sesion &&
    (sesion.esRoot || sesion.areas.some((a) => a.slug === "marketing"));
  if (!ok || !sesion) notFound();
  const puedeEditar =
    sesion.esAdmin ||
    sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura");

  const supabase = await createClient();
  const [plantillasRes, campanasRes, audienciasRes] = await Promise.all([
    supabase
      .from("plantillas_whatsapp")
      .select(
        "id, nombre, categoria, estado_aprobacion_meta, disparar_flujo_lucy",
      )
      .order("creado_en", { ascending: false }),
    supabase
      .from("campanas_whatsapp")
      .select("id, nombre, estado, fecha_enviada, plantillas_whatsapp(nombre)")
      .order("creado_en", { ascending: false }),
    supabase.from("audiencias").select("id, nombre").order("nombre"),
  ]);

  const campanas: CampanaWa[] = (campanasRes.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    estado: c.estado,
    fecha_enviada: c.fecha_enviada,
    plantilla_nombre:
      (c.plantillas_whatsapp as unknown as { nombre: string } | null)?.nombre ??
      null,
  }));

  return (
    <WhatsappView
      configurado={whatsappConfigurado()}
      puedeEditar={puedeEditar}
      plantillas={(plantillasRes.data ?? []) as PlantillaWa[]}
      campanas={campanas}
      audiencias={(audienciasRes.data ?? []) as AudienciaOpt[]}
    />
  );
}
