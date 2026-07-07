"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";

export interface OkrResult {
  ok: boolean;
  mensaje?: string;
}

async function uidActual(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Crear OKR. Transversal (areaSlug null) solo admin; de área, admin o gestor con edición.
export async function crearOkr(input: {
  titulo: string;
  descripcion: string;
  periodo: string;
  areaSlug: string | null;
}): Promise<OkrResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Sin sesión." };
  const titulo = input.titulo.trim();
  if (titulo.length < 3) return { ok: false, mensaje: "Falta el objetivo." };

  if (input.areaSlug === null) {
    if (!sesion.esAdmin)
      return {
        ok: false,
        mensaje: "Solo directivo/administrativo crea OKRs transversales.",
      };
  } else {
    const a = sesion.areas.find((x) => x.slug === input.areaSlug);
    if (!sesion.esAdmin && (!a || a.nivel === "lectura"))
      return { ok: false, mensaje: "No tenés permiso en esa área." };
  }

  const supabase = await createClient();
  let area_id: string | null = null;
  if (input.areaSlug) {
    const { data: area } = await supabase
      .from("areas")
      .select("id")
      .eq("nombre", input.areaSlug)
      .single();
    area_id = area?.id ?? null;
  }

  const { error } = await supabase.from("okrs").insert({
    titulo_objetivo: titulo,
    descripcion: input.descripcion.trim() || null,
    periodo: input.periodo.trim() || "Feria Effix 2026",
    area_id,
    responsable_id: await uidActual(),
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/okrs");
  return { ok: true };
}

export async function crearResultadoClave(input: {
  okrId: string;
  descripcion: string;
  valorMeta: number;
  unidad: string;
  kpiId: string | null;
}): Promise<OkrResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("resultados_clave").insert({
    okr_id: input.okrId,
    descripcion: input.descripcion.trim(),
    valor_meta: input.valorMeta || 0,
    unidad: input.unidad.trim() || null,
    kpi_relacionado_id: input.kpiId || null,
  });
  if (error) return { ok: false, mensaje: error.message };
  if (input.kpiId) await supabase.rpc("refrescar_okr_progreso");
  revalidatePath("/panel/okrs");
  return { ok: true };
}

export async function actualizarEstadoOkr(
  okrId: string,
  estado: string,
): Promise<OkrResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("okrs")
    .update({ estado })
    .eq("id", okrId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/okrs");
  return { ok: true };
}

// Solo para RC sin KPI (progreso manual). Los vinculados se actualizan solos.
export async function actualizarValorRc(
  rcId: string,
  valor: number,
): Promise<OkrResult> {
  const supabase = await createClient();
  const { data: rc } = await supabase
    .from("resultados_clave")
    .select("valor_meta, kpi_relacionado_id")
    .eq("id", rcId)
    .single();
  if (rc?.kpi_relacionado_id)
    return {
      ok: false,
      mensaje: "Este resultado se actualiza solo desde su KPI.",
    };
  const meta = Number(rc?.valor_meta) || 0;
  const progreso = meta > 0 ? Math.min(100, (100 * valor) / meta) : 0;
  const { error } = await supabase
    .from("resultados_clave")
    .update({ valor_actual: valor, progreso_calculado: progreso })
    .eq("id", rcId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/okrs");
  return { ok: true };
}

export async function registrarCheckin(
  okrId: string,
  comentario: string,
): Promise<OkrResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("checkins_okr").insert({
    okr_id: okrId,
    comentario: comentario.trim() || null,
    creado_por: await uidActual(),
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/okrs");
  return { ok: true };
}
