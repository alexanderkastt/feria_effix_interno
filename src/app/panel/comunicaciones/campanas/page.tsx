import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resendConfigurado } from "@/lib/resend";
import {
  CampanasEmailView,
  type CampanaRow,
  type AudienciaStat,
  type StatsEnvio,
} from "@/components/panel/CampanasEmailView";

export const dynamic = "force-dynamic";

type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function statsAudiencia(
  supabase: SupaClient,
  aud: { id: string; tipo: string; filtro: unknown },
): Promise<{ total: number; conConsentimiento: number }> {
  if (aud.tipo === "manual") {
    const { data } = await supabase
      .from("audiencia_contactos")
      .select("contactos(consentimiento_marketing)")
      .eq("audiencia_id", aud.id);
    const rows = (data ?? [])
      .map(
        (r) =>
          r.contactos as unknown as {
            consentimiento_marketing: boolean;
          } | null,
      )
      .filter(Boolean) as { consentimiento_marketing: boolean }[];
    return {
      total: rows.length,
      conConsentimiento: rows.filter((c) => c.consentimiento_marketing).length,
    };
  }
  const f = (aud.filtro ?? {}) as {
    tipo_contacto?: string;
    tag?: string;
    pais?: string;
  };
  const base = () => {
    let q = supabase
      .from("contactos")
      .select("id", { count: "exact", head: true });
    if (f.tipo_contacto) q = q.eq("tipo_contacto", f.tipo_contacto);
    if (f.pais) q = q.eq("pais", f.pais);
    if (f.tag) q = q.contains("tags", [f.tag]);
    return q;
  };
  const { count: total } = await base();
  const { count: conConsentimiento } = await base().eq(
    "consentimiento_marketing",
    true,
  );
  return { total: total ?? 0, conConsentimiento: conConsentimiento ?? 0 };
}

export default async function CampanasPage() {
  const sesion = await getSesion();
  const ok =
    sesion &&
    (sesion.esRoot || sesion.areas.some((a) => a.slug === "marketing"));
  if (!ok) notFound();
  const puedeEditar =
    sesion.esAdmin ||
    sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura");

  const supabase = await createClient();
  const [campRes, plRes, audRes, envRes] = await Promise.all([
    supabase
      .from("campanas_email")
      .select(
        "id, nombre, estado, prueba_enviada, plantilla_id, audiencia_id, plantillas_email(nombre), audiencias(nombre)",
      )
      .order("creado_en", { ascending: false }),
    supabase.from("plantillas_email").select("id, nombre").order("nombre"),
    supabase.from("audiencias").select("id, nombre, tipo, filtro"),
    supabase.from("envios_email").select("campana_id, estado"),
  ]);

  const campanas: CampanaRow[] = (campRes.data ?? []).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    estado: c.estado,
    prueba_enviada: c.prueba_enviada,
    plantilla_id: c.plantilla_id,
    audiencia_id: c.audiencia_id,
    plantilla_nombre:
      (c.plantillas_email as unknown as { nombre: string } | null)?.nombre ??
      null,
    audiencia_nombre:
      (c.audiencias as unknown as { nombre: string } | null)?.nombre ?? null,
  }));

  const audiencias: AudienciaStat[] = [];
  for (const a of audRes.data ?? []) {
    const s = await statsAudiencia(supabase, a);
    audiencias.push({ id: a.id, nombre: a.nombre, ...s });
  }

  const stats: Record<string, StatsEnvio> = {};
  for (const e of envRes.data ?? []) {
    if (!e.campana_id) continue;
    const s = (stats[e.campana_id] ??= {
      enviado: 0,
      entregado: 0,
      abierto: 0,
      click: 0,
      rebotado: 0,
      desuscrito: 0,
    });
    if (e.estado in s) s[e.estado as keyof StatsEnvio]++;
  }

  return (
    <CampanasEmailView
      campanas={campanas}
      plantillas={(plRes.data ?? []) as { id: string; nombre: string }[]}
      audiencias={audiencias}
      stats={stats}
      puedeEditar={puedeEditar}
      resendListo={resendConfigurado()}
    />
  );
}
