"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TipoPipeline = "alianza" | "comunidad";
export type EtapaPipeline =
  | "contactado"
  | "propuesta_enviada"
  | "negociacion"
  | "cerrado"
  | "descartado";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

function rutaDe(tipo: TipoPipeline) {
  return tipo === "alianza" ? "/panel/alianzas" : "/panel/comunidades";
}

// Crear un contacto en el pipeline (alianza o comunidad).
export async function crearContacto(input: {
  tipo: TipoPipeline;
  nombre_entidad: string;
  tipo_entidad: string;
  pais: string;
  codigo_descuento: string;
}): Promise<AccionResult> {
  const nombre = input.nombre_entidad.trim();
  if (nombre.length < 2) {
    return { ok: false, mensaje: "Falta el nombre de la entidad." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contactos_pipeline").insert({
    tipo: input.tipo,
    nombre_entidad: nombre,
    tipo_entidad: input.tipo_entidad.trim() || null,
    pais: input.pais.trim() || null,
    codigo_descuento: input.codigo_descuento.trim() || null,
    responsable_id: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath(rutaDe(input.tipo));
  return { ok: true };
}

// Mover un contacto de etapa (drag & drop). RLS valida el permiso del área.
export async function moverEtapa(
  id: string,
  etapa: EtapaPipeline,
  tipo: TipoPipeline,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos_pipeline")
    .update({ etapa })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath(rutaDe(tipo));
  return { ok: true };
}

// Crear una decisión estratégica (bitácora).
export async function crearDecision(input: {
  titulo: string;
  contexto: string;
  decision_tomada: string;
  tags: string[];
}): Promise<AccionResult> {
  const titulo = input.titulo.trim();
  if (titulo.length < 3) return { ok: false, mensaje: "Falta el título." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("decisiones_estrategicas").insert({
    titulo,
    contexto: input.contexto.trim() || null,
    decision_tomada: input.decision_tomada.trim() || null,
    tags: input.tags,
    responsable_id: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/estrategia");
  return { ok: true };
}
