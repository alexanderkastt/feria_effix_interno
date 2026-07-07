"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtapaMarketing =
  | "idea"
  | "en_diseno"
  | "programado"
  | "activo"
  | "finalizado"
  | "analizado";
export type CanalMarketing =
  | "meta_ads"
  | "google_ads"
  | "organico_instagram"
  | "organico_tiktok"
  | "email"
  | "whatsapp"
  | "influencers"
  | "otro";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

export async function crearIniciativa(input: {
  titulo: string;
  canal: CanalMarketing;
  presupuesto_asignado: number;
}): Promise<AccionResult> {
  if (input.titulo.trim().length < 2)
    return { ok: false, mensaje: "Falta el título." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("iniciativas_marketing").insert({
    titulo: input.titulo.trim(),
    canal: input.canal,
    presupuesto_asignado: input.presupuesto_asignado || null,
    responsable_id: user?.id ?? null,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/marketing");
  return { ok: true };
}

export async function moverEtapaMarketing(
  id: string,
  etapa: EtapaMarketing,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("iniciativas_marketing")
    .update({ etapa })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/marketing");
  return { ok: true };
}
