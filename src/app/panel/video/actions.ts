"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtapaVideo =
  | "guion"
  | "grabacion"
  | "edicion"
  | "revision"
  | "publicado";
export type TipoVideo =
  | "testimonio"
  | "backstage"
  | "ponente"
  | "recap"
  | "publicitario";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

export async function crearPiezaVideo(input: {
  titulo: string;
  tipo: TipoVideo;
}): Promise<AccionResult> {
  if (input.titulo.trim().length < 3)
    return { ok: false, mensaje: "Falta el título." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("piezas_video").insert({
    titulo: input.titulo.trim(),
    tipo: input.tipo,
    responsable_id: user?.id ?? null,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/video");
  return { ok: true };
}

export async function moverEtapaVideo(
  id: string,
  etapa: EtapaVideo,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("piezas_video")
    .update({ etapa })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/video");
  return { ok: true };
}
