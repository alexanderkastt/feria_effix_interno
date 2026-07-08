import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ReporteComunicaciones,
  type CampanaAlerta,
  type PorTipo,
  type ResumenComs,
} from "@/components/panel/ReporteComunicaciones";

export const dynamic = "force-dynamic";

type EnvioRow = {
  estado: string;
  campana_id: string | null;
  contactos: { tipo_contacto: string } | null;
};

const div = (a: number, b: number) => (b > 0 ? a / b : 0);

export default async function ReportesComunicacionesPage() {
  const sesion = await getSesion();
  const ok =
    sesion &&
    (sesion.esRoot || sesion.areas.some((a) => a.slug === "marketing"));
  if (!ok) notFound();

  const supabase = await createClient();
  const [campanasRes, enviosRes, waRes, consentRes] = await Promise.all([
    supabase.from("campanas_email").select("id, nombre, estado"),
    supabase
      .from("envios_email")
      .select("estado, campana_id, contactos(tipo_contacto)"),
    supabase.from("envios_whatsapp").select("estado"),
    supabase
      .from("contactos")
      .select("id", { count: "exact", head: true })
      .eq("consentimiento_marketing", true),
  ]);

  const envios = ((enviosRes.data ?? []) as unknown as EnvioRow[]).map((e) => ({
    estado: e.estado,
    campana_id: e.campana_id,
    tipo: (e.contactos as unknown as { tipo_contacto: string } | null)
      ?.tipo_contacto,
  }));

  const enviados = envios.length;
  const entregados = envios.filter((e) =>
    ["entregado", "abierto", "click"].includes(e.estado),
  ).length;
  const abiertos = envios.filter((e) =>
    ["abierto", "click"].includes(e.estado),
  ).length;
  const clics = envios.filter((e) => e.estado === "click").length;
  const desuscritos = envios.filter((e) => e.estado === "desuscrito").length;

  const wa = waRes.data ?? [];
  const resumen: ResumenComs = {
    campanasEnviadas: (campanasRes.data ?? []).filter(
      (c) => c.estado === "enviada",
    ).length,
    enviados,
    entregados,
    tasaApertura: div(abiertos, entregados),
    tasaClic: div(clics, entregados),
    tasaDesuscripcion: div(desuscritos, enviados),
    contactosConsentidos: consentRes.count ?? 0,
    wa: {
      enviados: wa.length,
      entregados: wa.filter((w) =>
        ["entregado", "leido", "respondido"].includes(w.estado),
      ).length,
      leidos: wa.filter((w) => ["leido", "respondido"].includes(w.estado))
        .length,
    },
  };

  // Por tipo de contacto
  const tipos = new Map<string, { env: number; ab: number; cl: number }>();
  for (const e of envios) {
    if (!e.tipo) continue;
    const r = tipos.get(e.tipo) ?? { env: 0, ab: 0, cl: 0 };
    r.env += 1;
    if (["abierto", "click"].includes(e.estado)) r.ab += 1;
    if (e.estado === "click") r.cl += 1;
    tipos.set(e.tipo, r);
  }
  const porTipo: PorTipo[] = [...tipos.entries()].map(([tipo, r]) => ({
    tipo,
    enviados: r.env,
    tasaApertura: div(r.ab, r.env),
    tasaClic: div(r.cl, r.env),
  }));

  // Alertas por campaña
  const nombres = new Map(
    (campanasRes.data ?? []).map((c) => [c.id, c.nombre]),
  );
  const porCampana = new Map<
    string,
    { env: number; reb: number; des: number }
  >();
  for (const e of envios) {
    if (!e.campana_id) continue;
    const r = porCampana.get(e.campana_id) ?? { env: 0, reb: 0, des: 0 };
    r.env += 1;
    if (e.estado === "rebotado") r.reb += 1;
    if (e.estado === "desuscrito") r.des += 1;
    porCampana.set(e.campana_id, r);
  }
  const campanas: CampanaAlerta[] = [...porCampana.entries()].map(([id, r]) => {
    const tasaRebote = div(r.reb, r.env);
    const tasaDesuscripcion = div(r.des, r.env);
    return {
      id,
      nombre: nombres.get(id) ?? "—",
      enviados: r.env,
      tasaRebote,
      tasaDesuscripcion,
      revisar: tasaRebote > 0.05 || tasaDesuscripcion > 0.02,
    };
  });

  return (
    <ReporteComunicaciones
      resumen={resumen}
      porTipo={porTipo}
      campanas={campanas}
    />
  );
}
