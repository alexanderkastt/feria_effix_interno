import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook de eventos de Resend. Actualiza envios_email por proveedor_message_id.
// Configurar la URL de este endpoint en el panel de Resend cuando haya credenciales.
const MAPA: Record<string, string> = {
  "email.delivered": "entregado",
  "email.opened": "abierto",
  "email.clicked": "click",
  "email.bounced": "rebotado",
  "email.complained": "desuscrito",
};

export async function POST(req: NextRequest) {
  let body: { type?: string; data?: { email_id?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const estado = body.type ? MAPA[body.type] : undefined;
  const messageId = body.data?.email_id;
  if (!estado || !messageId) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  await admin
    .from("envios_email")
    .update({ estado, fecha_evento: new Date().toISOString() })
    .eq("proveedor_message_id", messageId);

  // Una queja (complaint) también da de baja al contacto.
  if (body.type === "email.complained") {
    const { data } = await admin
      .from("envios_email")
      .select("contacto_id")
      .eq("proveedor_message_id", messageId)
      .single();
    if (data?.contacto_id) {
      await admin
        .from("contactos")
        .update({ consentimiento_marketing: false })
        .eq("id", data.contacto_id);
    }
  }

  return NextResponse.json({ ok: true });
}
