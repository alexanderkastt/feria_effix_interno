"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ContextoInput {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: string | null;
  meta_asistencia: number | null;
  precio_boleta: number | null;
  google_ads_id: string | null;
  ga4_id: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  notas: string | null;
}

export interface ContextoResult {
  ok: boolean;
  mensaje?: string;
}

// Upsert de la fila de contexto de la edición 2026. RLS: solo admin.
export async function guardarContexto(
  input: ContextoInput,
): Promise<ContextoResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("contexto_evento").upsert(
    {
      edicion: "2026",
      fecha_inicio: input.fecha_inicio,
      fecha_fin: input.fecha_fin,
      ubicacion: input.ubicacion,
      meta_asistencia: input.meta_asistencia,
      precio_boleta: input.precio_boleta,
      google_ads_id: input.google_ads_id,
      ga4_id: input.ga4_id,
      gtm_id: input.gtm_id,
      meta_pixel_id: input.meta_pixel_id,
      notas: input.notas,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "edicion" },
  );

  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/contexto");
  return { ok: true };
}
