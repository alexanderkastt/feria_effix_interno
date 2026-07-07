"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Elimina el registro de la biblioteca. RLS: solo el dueño o un admin.
export async function eliminarArchivo(id: string): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("biblioteca_archivos")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/biblioteca");
  return { ok: true };
}
