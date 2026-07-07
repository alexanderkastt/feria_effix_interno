import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREAS } from "@/lib/areas";
import {
  OkrsView,
  type OkrView,
  type RcView,
  type CheckinView,
} from "@/components/panel/OkrsView";

export const dynamic = "force-dynamic";

export default async function OkrsPage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  const supabase = await createClient();
  const { data: okrsData } = await supabase
    .from("okrs")
    .select(
      "id, titulo_objetivo, descripcion, periodo, estado, area:areas(nombre), resultados_clave(id, descripcion, valor_meta, valor_actual, unidad, progreso_calculado, kpi_relacionado_id), checkins_okr(id, fecha, comentario)",
    )
    .order("creado_en", { ascending: false });
  const { data: kpisData } = await supabase
    .from("kpis")
    .select("id, nombre")
    .order("nombre");

  const okrs: OkrView[] = (okrsData ?? []).map((o) => ({
    id: o.id,
    titulo_objetivo: o.titulo_objetivo,
    descripcion: o.descripcion,
    periodo: o.periodo,
    estado: o.estado,
    area: (o.area as unknown as { nombre: string } | null)?.nombre ?? null,
    resultados: (o.resultados_clave as unknown as RcView[]) ?? [],
    checkins: ((o.checkins_okr as unknown as CheckinView[]) ?? [])
      .slice()
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1)),
  }));

  const areasEditables = sesion.esAdmin
    ? AREAS.map((a) => ({ slug: a.slug, label: a.label }))
    : sesion.areas
        .filter((a) => a.nivel !== "lectura")
        .map((a) => ({ slug: a.slug, label: a.label }));

  return (
    <OkrsView
      okrs={okrs}
      kpis={(kpisData ?? []) as { id: string; nombre: string }[]}
      areasEditables={areasEditables}
      esAdmin={sesion.esAdmin}
    />
  );
}
