"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoTarea, Prioridad } from "@/lib/demo";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Crear tarea transversal. RLS exige que el usuario pueda editar al menos una
// de las áreas involucradas (o ser admin).
export async function crearTransversal(input: {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  areasInvolucradas: string[];
}): Promise<AccionResult> {
  const titulo = input.titulo.trim();
  if (titulo.length < 3) return { ok: false, mensaje: "Falta el título." };
  if (input.areasInvolucradas.length === 0) {
    return { ok: false, mensaje: "Elegí al menos un área involucrada." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tareas_transversales").insert({
    titulo,
    descripcion: input.descripcion.trim() || null,
    prioridad: input.prioridad,
    estado: "pendiente",
    areas_involucradas: input.areasInvolucradas,
    responsable_id: user?.id ?? null,
  });

  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/transversales");
  return { ok: true };
}

export async function moverTransversal(
  id: string,
  estado: EstadoTarea,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas_transversales")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/transversales");
  return { ok: true };
}
