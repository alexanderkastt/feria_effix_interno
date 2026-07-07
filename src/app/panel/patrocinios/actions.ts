"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Tier = "black" | "platino" | "diamante" | "oro" | "plata" | "bronce";
type EstadoPago = "pendiente" | "parcial" | "pagado";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// RLS: requiere puede_editar_area('patrocinios').
export async function crearPatrocinio(input: {
  empresa: string;
  tier: Tier;
  monto: number;
  entregables: string;
}): Promise<AccionResult> {
  const empresa = input.empresa.trim();
  if (empresa.length < 2) return { ok: false, mensaje: "Falta la empresa." };

  const supabase = await createClient();
  const { error } = await supabase.from("patrocinios").insert({
    empresa,
    tier: input.tier,
    monto: input.monto || 0,
    entregables_pendientes: input.entregables.trim() || null,
    estado_pago: "pendiente",
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/patrocinios");
  return { ok: true };
}

export async function cambiarEstadoPago(
  id: string,
  estado_pago: EstadoPago,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("patrocinios")
    .update({ estado_pago })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/patrocinios");
  return { ok: true };
}
