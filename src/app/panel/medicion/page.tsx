import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  MedicionView,
  type KpiRow,
  type OkrRow,
} from "@/components/panel/MedicionView";

export const dynamic = "force-dynamic";

export default async function MedicionPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const supabase = await createClient();
  const [okrsRes, kpisRes, valoresRes] = await Promise.all([
    supabase
      .from("okrs")
      .select(
        "id, titulo_objetivo, periodo, estado, area_id, resultados_clave(descripcion, valor_meta, valor_actual, unidad, progreso_calculado)",
      )
      .is("area_id", null),
    supabase
      .from("kpis")
      .select(
        "id, clave, nombre, unidad, tipo_calculo, meta, area:areas(nombre)",
      )
      .eq("activo", true),
    supabase
      .from("kpi_valores")
      .select("kpi_id, valor, fecha_medicion")
      .order("fecha_medicion", { ascending: false }),
  ]);

  // Último valor por KPI
  const ultimo = new Map<string, number>();
  for (const v of valoresRes.data ?? []) {
    if (!ultimo.has(v.kpi_id)) ultimo.set(v.kpi_id, Number(v.valor));
  }

  const kpis: KpiRow[] = (kpisRes.data ?? []).map((k) => ({
    id: k.id,
    nombre: k.nombre,
    unidad: k.unidad,
    tipo_calculo: k.tipo_calculo,
    meta: k.meta === null ? null : Number(k.meta),
    area: (k.area as unknown as { nombre: string } | null)?.nombre ?? null,
    valor: ultimo.get(k.id) ?? null,
  }));

  const okrs: OkrRow[] = (okrsRes.data ?? []).map((o) => {
    const rcs =
      (o.resultados_clave as unknown as {
        descripcion: string;
        valor_meta: number | null;
        valor_actual: number | null;
        unidad: string | null;
        progreso_calculado: number;
      }[]) ?? [];
    const progreso =
      rcs.length > 0
        ? rcs.reduce((s, r) => s + Number(r.progreso_calculado), 0) / rcs.length
        : 0;
    return {
      id: o.id,
      titulo: o.titulo_objetivo,
      estado: o.estado,
      progreso,
      resultados: rcs.map((r) => ({
        descripcion: r.descripcion,
        progreso: Number(r.progreso_calculado),
        valor_meta: r.valor_meta === null ? null : Number(r.valor_meta),
        valor_actual: r.valor_actual === null ? null : Number(r.valor_actual),
        unidad: r.unidad,
      })),
    };
  });

  const areas = [
    ...new Set(kpis.map((k) => k.area).filter(Boolean)),
  ] as string[];

  return <MedicionView okrs={okrs} kpis={kpis} areas={areas} />;
}
