import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  ReportesView,
  type ReporteData,
} from "@/components/panel/ReportesView";

export const dynamic = "force-dynamic";

function diasEntre(desde: Date, hasta: Date) {
  return Math.ceil((hasta.getTime() - desde.getTime()) / 86400000);
}

export default async function ReportesPage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  const supabase = await createClient();
  const hoy = new Date();
  const hoyISO = hoy.toISOString().slice(0, 10);

  // Reporte por área (respeta RLS: solo trae tareas visibles al usuario).
  const { data: tareas } = await supabase
    .from("tareas")
    .select("estado, prioridad, fecha_limite, areas(nombre)");

  const porArea = new Map<
    AreaSlug,
    {
      pendiente: number;
      en_proceso: number;
      bloqueado: number;
      hecho: number;
      criticas: number;
    }
  >();
  for (const t of tareas ?? []) {
    const slug = (t.areas as unknown as { nombre: AreaSlug } | null)?.nombre;
    if (!slug) continue;
    const r = porArea.get(slug) ?? {
      pendiente: 0,
      en_proceso: 0,
      bloqueado: 0,
      hecho: 0,
      criticas: 0,
    };
    r[t.estado as keyof typeof r] += 1;
    if (
      t.estado !== "hecho" &&
      t.prioridad === "alta" &&
      t.fecha_limite &&
      t.fecha_limite < hoyISO
    ) {
      r.criticas += 1;
    }
    porArea.set(slug, r);
  }

  const areasReporte = [...porArea.entries()]
    .filter(
      ([slug]) => sesion.esAdmin || sesion.areas.some((a) => a.slug === slug),
    )
    .map(([slug, r]) => ({
      slug,
      label: AREA_LABEL[slug],
      completadas: r.hecho,
      pendientes: r.pendiente,
      en_proceso: r.en_proceso,
      bloqueadas: r.bloqueado,
      criticas: r.criticas,
    }));

  // Reporte general: solo admin.
  let general: ReporteData["general"] = null;
  if (sesion.esAdmin) {
    const [
      { data: ctx },
      { data: stands },
      { data: patros },
      { data: ponentes },
      { data: ingresos },
      { data: gastos },
    ] = await Promise.all([
      supabase
        .from("contexto_evento")
        .select("fecha_inicio")
        .limit(1)
        .maybeSingle(),
      supabase.from("stands").select("estado"),
      supabase.from("patrocinios").select("monto, estado_pago"),
      supabase.from("postulaciones_ponentes").select("estado"),
      supabase.from("ingresos").select("monto, estado"),
      supabase.from("gastos").select("monto, estado"),
    ]);

    const standsTotal = stands?.length ?? 0;
    const standsVendidos = (stands ?? []).filter(
      (s) => s.estado === "vendido",
    ).length;
    const patrocinioTotal = (patros ?? []).reduce(
      (s, p) => s + Number(p.monto),
      0,
    );
    const patrocinioPagado = (patros ?? [])
      .filter((p) => p.estado_pago === "pagado")
      .reduce((s, p) => s + Number(p.monto), 0);
    const ingresosOk = (ingresos ?? [])
      .filter((i) => i.estado === "confirmado" || i.estado === "cobrado")
      .reduce((s, i) => s + Number(i.monto), 0);
    const gastosPagados = (gastos ?? [])
      .filter((g) => g.estado === "pagado")
      .reduce((s, g) => s + Number(g.monto), 0);

    general = {
      diasRestantes: ctx?.fecha_inicio
        ? diasEntre(hoy, new Date(ctx.fecha_inicio))
        : null,
      standsTotal,
      standsVendidos,
      pctStandsVendidos: standsTotal
        ? Math.round((standsVendidos / standsTotal) * 100)
        : 0,
      patrocinioTotal,
      patrocinioPagado,
      pctPatrocinio: patrocinioTotal
        ? Math.round((patrocinioPagado / patrocinioTotal) * 100)
        : 0,
      ponentesAceptados: (ponentes ?? []).filter((p) => p.estado === "aceptado")
        .length,
      balance: ingresosOk - gastosPagados,
      criticasTotales: areasReporte.reduce((s, a) => s + a.criticas, 0),
    };
  }

  const data: ReporteData = {
    esAdmin: sesion.esAdmin,
    general,
    areas: areasReporte,
  };
  return <ReportesView data={data} />;
}
