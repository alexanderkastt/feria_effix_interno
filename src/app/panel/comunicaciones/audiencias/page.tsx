import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  AudienciasView,
  type AudienciaVista,
} from "@/components/panel/AudienciasView";
import type { FiltroAudiencia } from "./actions";

export const dynamic = "force-dynamic";

interface ContactoMini {
  id: string;
  nombre: string | null;
  email: string | null;
  consentimiento_marketing: boolean;
}

export default async function AudienciasPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const puedeVer =
    sesion.esRoot || sesion.areas.some((a) => a.slug === "marketing");
  if (!puedeVer) notFound();
  const puedeEditar =
    sesion.esAdmin ||
    sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura");

  const supabase = await createClient();
  const { data: audienciasData } = await supabase
    .from("audiencias")
    .select("id, nombre, descripcion, tipo, filtro")
    .order("creado_en", { ascending: false });

  const audiencias: AudienciaVista[] = [];
  for (const a of audienciasData ?? []) {
    let miembros: ContactoMini[] = [];

    if (a.tipo === "dinamica") {
      const filtro = (a.filtro ?? {}) as FiltroAudiencia;
      let q = supabase
        .from("contactos")
        .select("id, nombre, email, consentimiento_marketing")
        .limit(200);
      if (filtro.tipo_contacto) q = q.eq("tipo_contacto", filtro.tipo_contacto);
      if (filtro.tag) q = q.contains("tags", [filtro.tag]);
      if (filtro.pais) q = q.eq("pais", filtro.pais);
      const { data } = await q;
      miembros = (data ?? []) as ContactoMini[];
    } else {
      const { data } = await supabase
        .from("audiencia_contactos")
        .select("contactos(id, nombre, email, consentimiento_marketing)")
        .eq("audiencia_id", a.id)
        .limit(500);
      miembros = (data ?? [])
        .map((r) => r.contactos as unknown as ContactoMini | null)
        .filter((c): c is ContactoMini => c !== null);
    }

    audiencias.push({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion,
      tipo: a.tipo,
      filtro: (a.filtro ?? null) as FiltroAudiencia | null,
      total: miembros.length,
      conConsentimiento: miembros.filter((c) => c.consentimiento_marketing)
        .length,
      miembros,
    });
  }

  return <AudienciasView audiencias={audiencias} puedeEditar={puedeEditar} />;
}
