import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Endpoint público de desuscripción (link del footer de cada email).
// Pone consentimiento_marketing = false en el contacto. No requiere auth.
export async function GET(req: NextRequest) {
  const c = req.nextUrl.searchParams.get("c");
  if (c && c !== "prueba") {
    try {
      const admin = createAdminClient();
      await admin
        .from("contactos")
        .update({ consentimiento_marketing: false })
        .eq("id", c);
    } catch {
      // Silencioso: igual mostramos confirmación al usuario.
    }
  }

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Baja confirmada · Feria Effix</title></head>
<body style="margin:0;background:#0d0d0d;color:#ededed;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh">
<div style="max-width:420px;text-align:center;padding:2rem">
<h1 style="font-size:1.4rem">Listo, te diste de baja</h1>
<p style="color:#9a9a9f">No vas a recibir más comunicaciones de marketing de Feria Effix. Si fue un error, escribinos a <a href="mailto:gerencia@feriaeffix.com" style="color:#1a6fff">gerencia@feriaeffix.com</a>.</p>
</div></body></html>`;
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
