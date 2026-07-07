"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";

export interface FiltroAudiencia {
  tipo_contacto?: string;
  tag?: string;
  pais?: string;
}

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

async function puedeEditarMarketing(): Promise<boolean> {
  const sesion = await getSesion();
  if (!sesion) return false;
  return (
    sesion.esAdmin ||
    sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura")
  );
}

// Aplica el filtro jsonb sobre una query de contactos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aplicarFiltro(q: any, filtro: FiltroAudiencia) {
  if (filtro.tipo_contacto) q = q.eq("tipo_contacto", filtro.tipo_contacto);
  if (filtro.tag) q = q.contains("tags", [filtro.tag]);
  if (filtro.pais) q = q.eq("pais", filtro.pais);
  return q;
}

// Cuenta en vivo cuántos contactos matchean un filtro dinámico y cuántos
// tienen consentimiento de marketing válido (los únicos elegibles para campañas).
export async function contarAudienciaDinamica(
  filtro: FiltroAudiencia,
): Promise<{ total: number; conConsentimiento: number }> {
  const supabase = await createClient();

  const base = supabase
    .from("contactos")
    .select("id", { count: "exact", head: true });
  const { count: total } = await aplicarFiltro(base, filtro);

  const conConsent = supabase
    .from("contactos")
    .select("id", { count: "exact", head: true })
    .eq("consentimiento_marketing", true);
  const { count: conConsentimiento } = await aplicarFiltro(conConsent, filtro);

  return { total: total ?? 0, conConsentimiento: conConsentimiento ?? 0 };
}

export async function crearAudienciaDinamica(
  nombre: string,
  descripcion: string,
  filtro: FiltroAudiencia,
): Promise<AccionResult> {
  if (!(await puedeEditarMarketing()))
    return { ok: false, mensaje: "Sin permiso." };
  if (nombre.trim().length < 2)
    return { ok: false, mensaje: "Falta el nombre." };

  const limpio: FiltroAudiencia = {};
  if (filtro.tipo_contacto) limpio.tipo_contacto = filtro.tipo_contacto;
  if (filtro.tag?.trim()) limpio.tag = filtro.tag.trim();
  if (filtro.pais?.trim()) limpio.pais = filtro.pais.trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("audiencias").insert({
    nombre: nombre.trim(),
    descripcion: descripcion.trim() || null,
    tipo: "dinamica",
    filtro: limpio,
    creada_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/audiencias");
  return { ok: true };
}

export async function crearAudienciaManual(
  nombre: string,
  descripcion: string,
): Promise<AccionResult> {
  if (!(await puedeEditarMarketing()))
    return { ok: false, mensaje: "Sin permiso." };
  if (nombre.trim().length < 2)
    return { ok: false, mensaje: "Falta el nombre." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("audiencias").insert({
    nombre: nombre.trim(),
    descripcion: descripcion.trim() || null,
    tipo: "manual",
    creada_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/audiencias");
  return { ok: true };
}

export async function quitarContactoDeAudiencia(
  audienciaId: string,
  contactoId: string,
): Promise<AccionResult> {
  if (!(await puedeEditarMarketing()))
    return { ok: false, mensaje: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("audiencia_contactos")
    .delete()
    .eq("audiencia_id", audienciaId)
    .eq("contacto_id", contactoId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/audiencias");
  return { ok: true };
}
