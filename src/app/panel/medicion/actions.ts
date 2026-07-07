"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Recalcula los KPIs automáticos y refresca el progreso de los OKRs vinculados.
export async function recalcularKpis(): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Sin sesión." };
  const supabase = await createClient();
  const r1 = await supabase.rpc("recalcular_kpis");
  const r2 = await supabase.rpc("refrescar_okr_progreso");
  if (r1.error || r2.error) {
    return { ok: false, mensaje: r1.error?.message ?? r2.error?.message };
  }
  revalidatePath("/panel/medicion");
  return { ok: true };
}

// Carga manual de un valor para un KPI de tipo_calculo = 'manual'.
export async function cargarValorManual(
  kpiId: string,
  valor: number,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Sin sesión." };
  if (!Number.isFinite(valor)) return { ok: false, mensaje: "Valor inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("kpi_valores").insert({
    kpi_id: kpiId,
    valor,
    fuente: "ingresado_manual",
    ingresado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  await supabase.rpc("refrescar_okr_progreso");
  revalidatePath("/panel/medicion");
  return { ok: true };
}
