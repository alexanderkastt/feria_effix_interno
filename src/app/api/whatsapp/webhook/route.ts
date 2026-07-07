import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook de WhatsApp Cloud API (Meta).
// GET: verificación del webhook (Meta manda hub.challenge).
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

// POST: estados de entrega/lectura → actualiza envios_whatsapp.
const MAPA: Record<string, string> = {
  sent: "enviado",
  delivered: "entregado",
  read: "leido",
  failed: "fallido",
};

export async function POST(req: NextRequest) {
  let body: {
    entry?: {
      changes?: { value?: { statuses?: { id: string; status: string }[] } }[];
    }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const st of change.value?.statuses ?? []) {
        const estado = MAPA[st.status];
        if (estado) {
          await admin
            .from("envios_whatsapp")
            .update({ estado, fecha_evento: new Date().toISOString() })
            .eq("proveedor_message_id", st.id);
        }
      }
    }
  }
  return NextResponse.json({ ok: true });
}
