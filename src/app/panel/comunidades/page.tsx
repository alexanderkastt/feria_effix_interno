import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PipelineCRM, type ContactoView } from "@/components/panel/PipelineCRM";

export const dynamic = "force-dynamic";

export default async function ComunidadesPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "comunidades");
  if (!sesion.esAdmin && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("contactos_pipeline")
    .select(
      "id, nombre_entidad, tipo_entidad, pais, etapa, codigo_descuento, fecha_corte_codigo, responsable:usuarios(nombre)",
    )
    .eq("tipo", "comunidad")
    .order("creado_en");

  const contactos: ContactoView[] = (data ?? []).map((c) => ({
    id: c.id,
    nombre_entidad: c.nombre_entidad,
    tipo_entidad: c.tipo_entidad,
    pais: c.pais,
    etapa: c.etapa,
    codigo_descuento: c.codigo_descuento,
    fecha_corte_codigo: c.fecha_corte_codigo,
    responsable:
      (c.responsable as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  return (
    <PipelineCRM
      tipo="comunidad"
      titulo="Comunidades"
      contactos={contactos}
      puedeEditar={puedeEditar}
    />
  );
}
