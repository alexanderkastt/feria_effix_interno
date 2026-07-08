"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Cada usuario solo puede tocar su propia fila: se usa el cliente con la
// sesión (no el admin client), y RLS `usuarios_update_propio` (id = auth.uid())
// es la única barrera real — el filtro .eq("id", user.id) de acá es defensa
// en profundidad, no la fuente de verdad del permiso.
export async function actualizarMiPerfil(input: {
  nombre: string;
  telefono: string | null;
  cargo: string | null;
  notif_por_email: boolean;
}): Promise<AccionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensaje: "No autenticado." };

  const nombre = input.nombre.trim();
  if (nombre.length < 2) {
    return { ok: false, mensaje: "El nombre es obligatorio." };
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      nombre,
      telefono: input.telefono?.trim() || null,
      cargo: input.cargo?.trim() || null,
      notif_por_email: input.notif_por_email,
    })
    .eq("id", user.id);
  if (error) return { ok: false, mensaje: error.message };

  revalidatePath("/panel/perfil");
  revalidatePath("/panel", "layout");
  return { ok: true };
}
