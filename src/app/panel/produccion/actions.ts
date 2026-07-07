"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type EtapaProduccion =
  | "planeado"
  | "cotizado"
  | "contratado"
  | "en_ejecucion"
  | "completado";
export type CategoriaProduccion =
  | "montaje"
  | "sonido"
  | "escenario"
  | "catering"
  | "transporte"
  | "senaletica_fisica";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

export async function crearItemProduccion(input: {
  descripcion: string;
  categoria: CategoriaProduccion;
  proveedor: string;
  costo_estimado: number;
}): Promise<AccionResult> {
  if (input.descripcion.trim().length < 2)
    return { ok: false, mensaje: "Falta la descripción." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("items_produccion").insert({
    descripcion: input.descripcion.trim(),
    categoria: input.categoria,
    proveedor: input.proveedor.trim() || null,
    costo_estimado: input.costo_estimado || null,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/produccion");
  return { ok: true };
}

export async function moverEtapaProduccion(
  id: string,
  etapa: EtapaProduccion,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items_produccion")
    .update({ etapa })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/produccion");
  return { ok: true };
}
