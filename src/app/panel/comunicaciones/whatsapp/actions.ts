"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { enviarPlantillaWhatsapp } from "@/lib/whatsapp";

type Categoria = "marketing" | "utilidad" | "autenticacion";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
  enviados?: number;
  errores?: number;
}

async function puedeMarketing(): Promise<boolean> {
  const s = await getSesion();
  if (!s) return false;
  return (
    s.esRoot ||
    s.areas.some((a) => a.slug === "marketing" && a.nivel !== "lectura")
  );
}

export async function crearPlantillaWhatsapp(input: {
  nombre: string;
  categoria: Categoria;
  texto_aprobado: string;
  disparar_flujo_lucy: boolean;
}): Promise<AccionResult> {
  if (!(await puedeMarketing())) return { ok: false, mensaje: "Sin permiso." };
  if (input.nombre.trim().length < 3)
    return { ok: false, mensaje: "Nombre muy corto." };

  const admin = createAdminClient();
  const { error } = await admin.from("plantillas_whatsapp").insert({
    nombre: input.nombre.trim(),
    categoria: input.categoria,
    texto_aprobado: input.texto_aprobado.trim() || null,
    disparar_flujo_lucy: input.disparar_flujo_lucy,
    estado_aprobacion_meta: "pendiente",
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/comunicaciones/whatsapp");
  return { ok: true };
}

interface ContactoWa {
  id: string;
  telefono: string;
}

async function contactosElegibles(
  admin: ReturnType<typeof createAdminClient>,
  audienciaId: string,
): Promise<ContactoWa[]> {
  const { data: aud } = await admin
    .from("audiencias")
    .select("tipo, filtro")
    .eq("id", audienciaId)
    .single();
  if (!aud) return [];

  if (aud.tipo === "manual") {
    const { data } = await admin
      .from("audiencia_contactos")
      .select("contactos(id, telefono_whatsapp, consentimiento_marketing)")
      .eq("audiencia_id", audienciaId);
    return (data ?? [])
      .map(
        (r) =>
          r.contactos as unknown as {
            id: string;
            telefono_whatsapp: string | null;
            consentimiento_marketing: boolean;
          } | null,
      )
      .filter(
        (
          c,
        ): c is {
          id: string;
          telefono_whatsapp: string;
          consentimiento_marketing: boolean;
        } => !!c && !!c.telefono_whatsapp && c.consentimiento_marketing,
      )
      .map((c) => ({ id: c.id, telefono: c.telefono_whatsapp }));
  }

  const f = (aud.filtro ?? {}) as {
    tipo_contacto?: string;
    tag?: string;
    pais?: string;
  };
  let q = admin
    .from("contactos")
    .select("id, telefono_whatsapp, consentimiento_marketing")
    .eq("consentimiento_marketing", true)
    .not("telefono_whatsapp", "is", null);
  if (f.tipo_contacto) q = q.eq("tipo_contacto", f.tipo_contacto);
  if (f.pais) q = q.eq("pais", f.pais);
  if (f.tag) q = q.contains("tags", [f.tag]);
  const { data } = await q;
  return (data ?? [])
    .filter((c) => !!c.telefono_whatsapp)
    .map((c) => ({ id: c.id, telefono: c.telefono_whatsapp as string }));
}

// Broadcast SOLO con plantilla aprobada por Meta. Verificación server-side (no solo UI).
export async function enviarCampanaWhatsapp(input: {
  nombre: string;
  plantillaId: string;
  audienciaId: string;
}): Promise<AccionResult> {
  if (!(await puedeMarketing())) return { ok: false, mensaje: "Sin permiso." };

  const admin = createAdminClient();
  const { data: pl } = await admin
    .from("plantillas_whatsapp")
    .select("id, nombre, meta_template_id, estado_aprobacion_meta")
    .eq("id", input.plantillaId)
    .single();
  if (!pl) return { ok: false, mensaje: "Plantilla no encontrada." };
  if (pl.estado_aprobacion_meta !== "aprobada") {
    return {
      ok: false,
      mensaje: "Solo se puede enviar con una plantilla APROBADA por Meta.",
    };
  }

  const { data: campana } = await admin
    .from("campanas_whatsapp")
    .insert({
      nombre: input.nombre.trim() || "Campaña WhatsApp",
      plantilla_id: input.plantillaId,
      audiencia_id: input.audienciaId,
      estado: "enviando",
    })
    .select("id")
    .single();

  const contactos = await contactosElegibles(admin, input.audienciaId);
  const nombrePlantilla = pl.meta_template_id ?? pl.nombre;
  let enviados = 0;
  let errores = 0;

  for (const c of contactos) {
    const r = await enviarPlantillaWhatsapp(c.telefono, nombrePlantilla);
    await admin.from("envios_whatsapp").insert({
      campana_id: campana?.id ?? null,
      contacto_id: c.id,
      telefono: c.telefono,
      estado: r.ok ? "enviado" : "fallido",
      proveedor_message_id: r.id ?? null,
      fecha_evento: new Date().toISOString(),
    });
    if (r.ok) enviados++;
    else errores++;
  }

  await admin
    .from("campanas_whatsapp")
    .update({ estado: "enviada", fecha_enviada: new Date().toISOString() })
    .eq("id", campana?.id ?? "");

  revalidatePath("/panel/comunicaciones/whatsapp");
  return { ok: true, enviados, errores };
}
