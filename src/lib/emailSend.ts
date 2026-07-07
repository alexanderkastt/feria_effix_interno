import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { enviarResend, resendConfigurado } from "@/lib/resend";

// ============================================================================
// Camino ÚNICO y seguro de envío de email. Garantías (Ley 1581):
//  - Campañas masivas: SOLO contactos con consentimiento_marketing = true (filtro duro).
//  - Footer de baja insertado automáticamente en cada envío (no evitable).
//  - Todo envío se registra en envios_email (trazabilidad, incl. transaccionales).
// El server action que llame acá DEBE verificar antes el permiso del usuario.
// ============================================================================

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface Contacto {
  id: string;
  nombre: string | null;
  email: string;
}

function personalizar(txt: string, c: Contacto): string {
  return (txt ?? "")
    .replaceAll("{{nombre}}", c.nombre ?? "")
    .replaceAll("{{email}}", c.email);
}

function footerHtml(contactoId: string): string {
  const url = `${BASE}/baja?c=${contactoId}`;
  return `<hr/><p style="font-size:12px;color:#9a9a9f;text-align:center">Recibís esto porque diste tu consentimiento para comunicaciones de Feria Effix.<br/><a href="${url}" style="color:#1a6fff">Darme de baja</a></p>`;
}
function footerTexto(contactoId: string): string {
  return `\n\n---\nDarme de baja: ${BASE}/baja?c=${contactoId}`;
}

// Resuelve los contactos de una audiencia. `soloConsentimiento` = filtro duro.
async function resolverContactos(
  audienciaId: string,
  soloConsentimiento: boolean,
): Promise<Contacto[]> {
  const admin = createAdminClient();
  const { data: aud } = await admin
    .from("audiencias")
    .select("tipo, filtro")
    .eq("id", audienciaId)
    .single();
  if (!aud) return [];

  if (aud.tipo === "manual") {
    const { data } = await admin
      .from("audiencia_contactos")
      .select("contactos(id, nombre, email, consentimiento_marketing)")
      .eq("audiencia_id", audienciaId);
    return (data ?? [])
      .map(
        (r) =>
          r.contactos as unknown as
            | (Contacto & { consentimiento_marketing: boolean })
            | null,
      )
      .filter(
        (c): c is Contacto & { consentimiento_marketing: boolean } =>
          !!c && !!c.email,
      )
      .filter((c) => (soloConsentimiento ? c.consentimiento_marketing : true))
      .map((c) => ({ id: c.id, nombre: c.nombre, email: c.email }));
  }

  // dinámica: aplica el filtro jsonb sobre contactos
  const f = (aud.filtro ?? {}) as {
    tipo_contacto?: string;
    tag?: string;
    pais?: string;
  };
  let q = admin
    .from("contactos")
    .select("id, nombre, email, consentimiento_marketing");
  if (f.tipo_contacto) q = q.eq("tipo_contacto", f.tipo_contacto);
  if (f.pais) q = q.eq("pais", f.pais);
  if (f.tag) q = q.contains("tags", [f.tag]);
  if (soloConsentimiento) q = q.eq("consentimiento_marketing", true);
  const { data } = await q;
  return (data ?? [])
    .filter((c) => !!c.email)
    .map((c) => ({ id: c.id, nombre: c.nombre, email: c.email }));
}

export interface ResultadoCampana {
  ok: boolean;
  enviados: number;
  excluidosSinConsentimiento: number;
  errores: number;
  mensaje?: string;
}

// Envío masivo de una campaña. Filtro de consentimiento DURO + footer + registro.
export async function enviarCampana(
  campanaId: string,
): Promise<ResultadoCampana> {
  const base = { enviados: 0, excluidosSinConsentimiento: 0, errores: 0 };
  if (!resendConfigurado()) {
    return {
      ok: false,
      ...base,
      mensaje: "Resend no está configurado (falta RESEND_API_KEY).",
    };
  }
  const admin = createAdminClient();
  const { data: campana } = await admin
    .from("campanas_email")
    .select(
      "id, audiencia_id, prueba_enviada, plantillas_email(asunto, contenido_html, contenido_texto)",
    )
    .eq("id", campanaId)
    .single();
  if (!campana)
    return { ok: false, ...base, mensaje: "Campaña no encontrada." };
  if (!campana.prueba_enviada) {
    return {
      ok: false,
      ...base,
      mensaje: "Enviá un correo de prueba antes del envío real.",
    };
  }
  const pl = campana.plantillas_email as unknown as {
    asunto: string;
    contenido_html: string;
    contenido_texto: string;
  } | null;
  if (!pl)
    return { ok: false, ...base, mensaje: "La campaña no tiene plantilla." };

  // Total que matchea (con y sin consentimiento) para reportar exclusiones.
  const todos = await resolverContactos(campana.audiencia_id, false);
  const elegibles = await resolverContactos(campana.audiencia_id, true);
  base.excluidosSinConsentimiento = todos.length - elegibles.length;

  await admin
    .from("campanas_email")
    .update({ estado: "enviando" })
    .eq("id", campanaId);

  for (const c of elegibles) {
    const html = personalizar(pl.contenido_html, c) + footerHtml(c.id);
    const text = personalizar(pl.contenido_texto, c) + footerTexto(c.id);
    const r = await enviarResend({
      to: c.email,
      subject: personalizar(pl.asunto, c),
      html,
      text,
    });
    await admin.from("envios_email").insert({
      campana_id: campanaId,
      contacto_id: c.id,
      email: c.email,
      estado: r.ok ? "enviado" : "rebotado",
      proveedor_message_id: r.id ?? null,
      fecha_evento: new Date().toISOString(),
    });
    if (r.ok) base.enviados++;
    else base.errores++;
  }

  await admin
    .from("campanas_email")
    .update({ estado: "enviada", fecha_enviada: new Date().toISOString() })
    .eq("id", campanaId);

  return { ok: true, ...base };
}

// Envío de PRUEBA a un correo interno. Habilita el envío real (prueba_enviada=true).
export async function enviarPrueba(
  campanaId: string,
  emailPrueba: string,
): Promise<{ ok: boolean; mensaje?: string }> {
  if (!resendConfigurado())
    return { ok: false, mensaje: "Resend no configurado." };
  const admin = createAdminClient();
  const { data: campana } = await admin
    .from("campanas_email")
    .select("plantillas_email(asunto, contenido_html, contenido_texto)")
    .eq("id", campanaId)
    .single();
  const pl = campana?.plantillas_email as unknown as {
    asunto: string;
    contenido_html: string;
    contenido_texto: string;
  } | null;
  if (!pl) return { ok: false, mensaje: "Campaña sin plantilla." };
  const c: Contacto = { id: "prueba", nombre: "Prueba", email: emailPrueba };
  const r = await enviarResend({
    to: emailPrueba,
    subject: `[PRUEBA] ${pl.asunto}`,
    html: personalizar(pl.contenido_html, c) + footerHtml("prueba"),
    text: personalizar(pl.contenido_texto, c) + footerTexto("prueba"),
  });
  if (!r.ok) return { ok: false, mensaje: r.error };
  await admin
    .from("campanas_email")
    .update({ prueba_enviada: true })
    .eq("id", campanaId);
  return { ok: true };
}

// Envío TRANSACCIONAL (Bloque C): exento del filtro de marketing (servicio pedido),
// pero se registra igual en envios_email.
export async function enviarTransaccional(
  contacto: Contacto,
  asunto: string,
  html: string,
  texto: string,
): Promise<{ ok: boolean; mensaje?: string }> {
  if (!resendConfigurado())
    return { ok: false, mensaje: "Resend no configurado." };
  const admin = createAdminClient();
  const r = await enviarResend({
    to: contacto.email,
    subject: asunto,
    html,
    text: texto,
  });
  await admin.from("envios_email").insert({
    contacto_id: contacto.id === "prueba" ? null : contacto.id,
    email: contacto.email,
    estado: r.ok ? "enviado" : "rebotado",
    es_transaccional: true,
    proveedor_message_id: r.id ?? null,
    fecha_evento: new Date().toISOString(),
  });
  return r.ok ? { ok: true } : { ok: false, mensaje: r.error };
}
