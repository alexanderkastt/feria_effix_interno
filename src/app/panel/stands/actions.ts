"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type EstadoStand =
  | "disponible"
  | "bloqueado_temporal"
  | "reservado"
  | "vendido";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Cambiar estado manualmente (casos gestionados por fuera del formulario público).
// RLS: requiere puede_editar_area('stands').
export async function cambiarEstadoStand(
  id: string,
  estado: EstadoStand,
): Promise<AccionResult> {
  const supabase = await createClient();
  // Al liberar a 'disponible' limpiamos datos de cliente y bloqueo.
  const extra =
    estado === "disponible"
      ? {
          bloqueado_hasta: null,
          cliente_nombre: null,
          cliente_email: null,
          cliente_telefono: null,
        }
      : {};
  const { error } = await supabase
    .from("stands")
    .update({ estado, ...extra })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}

// Vincular / desvincular un stand con un patrocinador.
export async function vincularPatrocinador(
  standId: string,
  patrocinadorId: string | null,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stands")
    .update({ patrocinador_id: patrocinadorId })
    .eq("id", standId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  return { ok: true };
}
