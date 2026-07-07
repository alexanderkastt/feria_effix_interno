"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoTarea, Prioridad } from "@/lib/demo";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Crear tarea. RLS exige que el usuario pueda editar el área (puede_editar_area).
export async function crearTarea(input: {
  areaId: string;
  areaSlug: string;
  titulo: string;
  prioridad: Prioridad;
}): Promise<AccionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("tareas").insert({
    area_id: input.areaId,
    titulo: input.titulo,
    prioridad: input.prioridad,
    estado: "pendiente",
    responsable_id: user?.id ?? null,
  });

  if (error) return { ok: false, mensaje: error.message };
  revalidatePath(`/panel/${input.areaSlug}`);
  revalidatePath("/panel");
  return { ok: true };
}

// Mover tarea de estado. RLS valida permiso de edición sobre el área.
export async function moverTarea(input: {
  id: string;
  estado: EstadoTarea;
  areaSlug: string;
}): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tareas")
    .update({ estado: input.estado })
    .eq("id", input.id);

  if (error) return { ok: false, mensaje: error.message };
  revalidatePath(`/panel/${input.areaSlug}`);
  revalidatePath("/panel");
  return { ok: true };
}
