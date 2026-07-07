"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type TipoContacto =
  | "comprador_boleta"
  | "postulante_ponente"
  | "cliente_stand"
  | "patrocinador"
  | "aliado"
  | "comunidad"
  | "embajador"
  | "otro";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

export interface ImportResult extends AccionResult {
  conConsentimiento: number;
  pendientes: number;
  rechazadas: number;
  duplicadas: number;
}

const TAG_PENDIENTE = "consentimiento_pendiente_verificar";

function limpiar(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function normEmail(v: unknown): string | null {
  const e = limpiar(v).toLowerCase();
  return e && e.includes("@") ? e : null;
}

export async function crearContacto(input: {
  nombre: string;
  email: string;
  telefono_whatsapp: string;
  tipo_contacto: TipoContacto;
  pais: string;
}): Promise<AccionResult> {
  const supabase = await createClient();
  const email = normEmail(input.email);
  const tel = limpiar(input.telefono_whatsapp) || null;
  if (!email && !tel) {
    return { ok: false, mensaje: "Se requiere email o teléfono." };
  }
  const { error } = await supabase.from("contactos").insert({
    nombre: limpiar(input.nombre) || null,
    email,
    telefono_whatsapp: tel,
    tipo_contacto: input.tipo_contacto || "otro",
    pais: limpiar(input.pais) || null,
  });
  if (error) {
    return {
      ok: false,
      mensaje: error.message.includes("duplicate")
        ? "Ya existe un contacto con ese email."
        : error.message,
    };
  }
  revalidatePath("/panel/comunicaciones/contactos");
  return { ok: true };
}

export async function editarContacto(
  id: string,
  input: {
    nombre: string;
    telefono_whatsapp: string;
    tipo_contacto: TipoContacto;
    pais: string;
  },
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("contactos")
    .update({
      nombre: limpiar(input.nombre) || null,
      telefono_whatsapp: limpiar(input.telefono_whatsapp) || null,
      tipo_contacto: input.tipo_contacto,
      pais: limpiar(input.pais) || null,
    })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/contactos");
  return { ok: true };
}

// Registrar consentimiento (Ley 1581): setea true + fecha + origen y quita el tag pendiente.
export async function marcarConsentimiento(
  id: string,
  origen: string,
): Promise<AccionResult> {
  if (limpiar(origen).length < 3) {
    return { ok: false, mensaje: "Indicá el origen del consentimiento." };
  }
  const supabase = await createClient();
  const { data: actual } = await supabase
    .from("contactos")
    .select("tags")
    .eq("id", id)
    .single();
  const tags = ((actual?.tags as string[] | null) ?? []).filter(
    (t) => t !== TAG_PENDIENTE,
  );
  const { error } = await supabase
    .from("contactos")
    .update({
      consentimiento_marketing: true,
      fecha_consentimiento: new Date().toISOString(),
      origen_consentimiento: limpiar(origen),
      tags,
    })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/contactos");
  return { ok: true };
}

// Import CSV. Ley 1581: sin consentimiento claro → NO se asume; queda false + tag pendiente.
export async function importarContactosCsv(
  filas: Record<string, string>[],
): Promise<ImportResult> {
  const supabase = await createClient();
  let conConsentimiento = 0;
  let pendientes = 0;
  let rechazadas = 0;
  let duplicadas = 0;

  const consienteValores = new Set(["si", "sí", "true", "1", "yes", "y", "x"]);
  const pick = (row: Record<string, string>, keys: string[]) => {
    for (const k of Object.keys(row)) {
      if (keys.some((kk) => k.toLowerCase().trim().includes(kk))) return row[k];
    }
    return "";
  };

  for (const row of filas) {
    const email = normEmail(pick(row, ["email", "correo", "mail"]));
    if (!email) {
      rechazadas += 1;
      continue;
    }
    const consienteRaw = limpiar(
      pick(row, ["consent", "acepta", "autoriza", "opt"]),
    ).toLowerCase();
    const consiente = consienteValores.has(consienteRaw);
    const origen = limpiar(pick(row, ["origen", "fuente", "source"]));

    const registro = {
      nombre: limpiar(pick(row, ["nombre", "name"])) || null,
      email,
      telefono_whatsapp:
        limpiar(pick(row, ["telefono", "whatsapp", "phone", "celular"])) ||
        null,
      pais: limpiar(pick(row, ["pais", "país", "country"])) || null,
      tipo_contacto: "otro" as TipoContacto,
      consentimiento_marketing: consiente,
      fecha_consentimiento: consiente ? new Date().toISOString() : null,
      origen_consentimiento: consiente ? origen || "import_csv" : null,
      tags: consiente ? [] : [TAG_PENDIENTE],
    };

    const { error } = await supabase.from("contactos").insert(registro);
    if (error) {
      if (error.message.includes("duplicate")) duplicadas += 1;
      else rechazadas += 1;
      continue;
    }
    if (consiente) conConsentimiento += 1;
    else pendientes += 1;
  }

  revalidatePath("/panel/comunicaciones/contactos");
  return {
    ok: true,
    conConsentimiento,
    pendientes,
    rechazadas,
    duplicadas,
    mensaje: `Importadas: ${conConsentimiento} con consentimiento, ${pendientes} pendientes de verificar, ${duplicadas} duplicadas, ${rechazadas} rechazadas (sin email válido).`,
  };
}

export async function crearAudienciaDesdeFiltro(
  nombre: string,
  contactoIds: string[],
): Promise<AccionResult> {
  if (limpiar(nombre).length < 2) {
    return { ok: false, mensaje: "Ponele nombre a la audiencia." };
  }
  if (contactoIds.length === 0) {
    return { ok: false, mensaje: "No hay contactos en el filtro actual." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: aud, error } = await supabase
    .from("audiencias")
    .insert({
      nombre: limpiar(nombre),
      tipo: "manual",
      creada_por: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !aud) {
    return { ok: false, mensaje: error?.message ?? "No se pudo crear." };
  }
  const filas = contactoIds.map((cid) => ({
    audiencia_id: aud.id,
    contacto_id: cid,
  }));
  const { error: e2 } = await supabase
    .from("audiencia_contactos")
    .insert(filas);
  if (e2) return { ok: false, mensaje: e2.message };
  revalidatePath("/panel/comunicaciones/contactos");
  return {
    ok: true,
    mensaje: `Audiencia "${nombre}" creada con ${contactoIds.length} contactos.`,
  };
}
