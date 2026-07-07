"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtapaDiseno =
  | "solicitado"
  | "en_diseno"
  | "en_revision"
  | "aprobado"
  | "entregado";
export type TipoPieza =
  | "escarapela"
  | "banner"
  | "redes_sociales"
  | "impreso"
  | "senaletica"
  | "otro";
export type PrioridadDiseno = "baja" | "media" | "alta" | "urgente";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

export async function crearSolicitudDiseno(input: {
  titulo: string;
  tipo_pieza: TipoPieza;
  prioridad: PrioridadDiseno;
  area_solicitante: string | null;
}): Promise<AccionResult> {
  if (input.titulo.trim().length < 3)
    return { ok: false, mensaje: "Falta el título." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("solicitudes_diseno").insert({
    titulo: input.titulo.trim(),
    tipo_pieza: input.tipo_pieza,
    prioridad: input.prioridad,
    area_solicitante: input.area_solicitante,
    responsable_id: user?.id ?? null,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/diseno");
  return { ok: true };
}

export async function moverEtapaDiseno(
  id: string,
  etapa: EtapaDiseno,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solicitudes_diseno")
    .update({ etapa })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/diseno");
  return { ok: true };
}
