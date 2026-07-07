import "server-only";

// WhatsApp Business Cloud API (Meta) — OFICIAL. Solo servidor.
// Solo permite iniciar conversación con PLANTILLAS aprobadas por Meta (>24h).
// Degrada con gracia si no está configurado.
const VERSION = "v21.0";

export function whatsappConfigurado(): boolean {
  return !!process.env.WHATSAPP_TOKEN && !!process.env.WHATSAPP_PHONE_ID;
}

export interface ResultadoWa {
  ok: boolean;
  id?: string;
  error?: string;
}

// Envía un mensaje de PLANTILLA aprobada (único modo permitido fuera de la ventana de 24h).
export async function enviarPlantillaWhatsapp(
  telefono: string,
  metaTemplateName: string,
  idioma = "es",
  variables: string[] = [],
): Promise<ResultadoWa> {
  if (!whatsappConfigurado()) {
    return {
      ok: false,
      error: "WhatsApp no configurado (falta WHATSAPP_TOKEN/PHONE_ID)",
    };
  }
  try {
    const url = `https://graph.facebook.com/${VERSION}/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const components =
      variables.length > 0
        ? [
            {
              type: "body",
              parameters: variables.map((v) => ({ type: "text", text: v })),
            },
          ]
        : undefined;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefono,
        type: "template",
        template: {
          name: metaTemplateName,
          language: { code: idioma },
          components,
        },
      }),
    });
    const data = (await res.json()) as {
      messages?: { id: string }[];
      error?: { message: string };
    };
    if (!res.ok)
      return { ok: false, error: data.error?.message ?? "Error de Meta" };
    return { ok: true, id: data.messages?.[0]?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de red",
    };
  }
}
