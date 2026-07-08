"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

async function permiso(): Promise<boolean> {
  const sesion = await getSesion();
  return !!(
    sesion &&
    (sesion.esRoot ||
      sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura"))
  );
}

function detectarVariables(...textos: string[]): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  for (const t of textos) {
    for (const m of (t ?? "").matchAll(re)) set.add(m[1]);
  }
  return [...set];
}

export interface PlantillaInput {
  nombre: string;
  asunto: string;
  contenido_html: string;
  contenido_texto: string;
  es_transaccional: boolean;
  area_relacionada: string | null;
}

export async function crearPlantilla(
  input: PlantillaInput,
): Promise<AccionResult> {
  if (!(await permiso())) return { ok: false, mensaje: "Sin permiso." };
  if (input.nombre.trim().length < 2)
    return { ok: false, mensaje: "Falta el nombre." };
  if (input.contenido_texto.trim().length < 1)
    return { ok: false, mensaje: "La versión de texto plano es obligatoria." };

  const supabase = await createClient();
  const { error } = await supabase.from("plantillas_email").insert({
    nombre: input.nombre.trim(),
    asunto: input.asunto.trim(),
    contenido_html: input.contenido_html,
    contenido_texto: input.contenido_texto,
    variables_usadas: detectarVariables(
      input.asunto,
      input.contenido_html,
      input.contenido_texto,
    ),
    es_transaccional: input.es_transaccional,
    area_relacionada: input.area_relacionada,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/plantillas");
  return { ok: true };
}

export async function editarPlantilla(
  id: string,
  input: PlantillaInput,
): Promise<AccionResult> {
  if (!(await permiso())) return { ok: false, mensaje: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("plantillas_email")
    .update({
      nombre: input.nombre.trim(),
      asunto: input.asunto.trim(),
      contenido_html: input.contenido_html,
      contenido_texto: input.contenido_texto,
      variables_usadas: detectarVariables(
        input.asunto,
        input.contenido_html,
        input.contenido_texto,
      ),
      es_transaccional: input.es_transaccional,
      area_relacionada: input.area_relacionada,
    })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/plantillas");
  return { ok: true };
}
