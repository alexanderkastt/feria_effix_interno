"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";
import {
  enviarPrueba,
  enviarCampana,
  type ResultadoCampana,
} from "@/lib/emailSend";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

async function permiso(): Promise<boolean> {
  const sesion = await getSesion();
  return !!(
    sesion &&
    (sesion.esRoot ||
      sesion.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura"))
  );
}

export async function crearCampana(input: {
  nombre: string;
  plantilla_id: string;
  audiencia_id: string;
}): Promise<AccionResult> {
  if (!(await permiso())) return { ok: false, mensaje: "Sin permiso." };
  if (input.nombre.trim().length < 2)
    return { ok: false, mensaje: "Falta el nombre." };
  if (!input.plantilla_id || !input.audiencia_id)
    return { ok: false, mensaje: "Elegí plantilla y audiencia." };

  const supabase = await createClient();
  const { error } = await supabase.from("campanas_email").insert({
    nombre: input.nombre.trim(),
    plantilla_id: input.plantilla_id,
    audiencia_id: input.audiencia_id,
    estado: "borrador",
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/campanas");
  return { ok: true };
}

// Envío de prueba (habilita el envío real). Usa el camino seguro emailSend.
export async function enviarPruebaCampana(
  campanaId: string,
  email: string,
): Promise<AccionResult> {
  if (!(await permiso())) return { ok: false, mensaje: "Sin permiso." };
  if (!email.includes("@"))
    return { ok: false, mensaje: "Correo de prueba inválido." };
  const r = await enviarPrueba(campanaId, email.trim());
  revalidatePath("/panel/comunicaciones/campanas");
  return r;
}

// Envío real. emailSend aplica el filtro DURO de consentimiento + footer + registro,
// y rechaza si no se envió prueba antes.
export async function enviarCampanaReal(
  campanaId: string,
): Promise<ResultadoCampana> {
  if (!(await permiso()))
    return {
      ok: false,
      enviados: 0,
      excluidosSinConsentimiento: 0,
      errores: 0,
      mensaje: "Sin permiso.",
    };
  const r = await enviarCampana(campanaId);
  revalidatePath("/panel/comunicaciones/campanas");
  return r;
}
