"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Guarda una nota/observación de reporte en `decisiones_estrategicas`
// (alimenta el módulo de Estrategia). RLS exige poder editar 'estrategia'.
export async function guardarNotaReporte(input: {
  reporte: string;
  texto: string;
}): Promise<AccionResult> {
  const texto = input.texto.trim();
  if (texto.length < 3) return { ok: false, mensaje: "Escribí una nota." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("decisiones_estrategicas").insert({
    titulo: `Nota de reporte: ${input.reporte}`,
    contexto: `Observación registrada desde el módulo de Reportes.`,
    decision_tomada: texto,
    responsable_id: user?.id ?? null,
    tags: ["reporte"],
  });

  if (error) {
    return {
      ok: false,
      mensaje: "No se pudo guardar la nota (¿tenés permiso sobre Estrategia?).",
    };
  }
  revalidatePath("/panel/reportes");
  revalidatePath("/panel/estrategia");
  return { ok: true, mensaje: "Nota guardada en Estrategia." };
}
