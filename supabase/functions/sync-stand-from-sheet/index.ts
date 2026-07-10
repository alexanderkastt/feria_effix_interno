// Recibe filas editadas en el Google Sheet "STANDS 2026" (vía Apps Script)
// y actualiza SOLO las columnas "dueñas del Sheet" en `stands`:
// pabellon, tipo_stand, tamano, valor_sin_iva, valor_con_iva.
// Nunca toca estado_venta, pagos, checklist, cliente_* ni directorio_* —
// esos son dueños de la plataforma y se editan solo desde el panel.
import { createClient } from "npm:@supabase/supabase-js@2";

const PABELLON_MAP: Record<string, string> = {
  AZUL: "azul",
  AMARILLO: "amarillo",
  BLANCO: "blanco",
  ROJO: "rojo",
  "ZONA DE COMIDAS": "zona_comidas",
  BURBUJAS: "burbujas",
  "GRAN SALON": "gran_salon",
  PLAZOLETA: "plazoleta",
  "HALL VERDE": "hall_verde",
  HALL: "hall",
};

const TIPO_STAND_MAP: Record<string, string> = {
  ISLA: "isla",
  "TIPO U": "tipo_u",
  ESQUINERO: "esquinero",
  LINEAL: "lineal",
};

function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = req.headers.get("X-Sync-Secret");
  if (!secret || secret !== Deno.env.get("SHEET_SYNC_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.rows)) {
    return new Response(
      JSON.stringify({ error: "body.rows debe ser un array" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Array<{ codigo: string; ok: boolean; error?: string }> = [];

  for (const row of body.rows) {
    const codigo = String(row.codigo ?? "").trim();
    if (!codigo) continue;

    const update: Record<string, unknown> = {};

    if (row.pabellon !== undefined && row.pabellon !== "") {
      const mapped = PABELLON_MAP[normalizeKey(row.pabellon)];
      if (mapped) update.pabellon = mapped;
    }
    if (row.tipo_stand !== undefined && row.tipo_stand !== "") {
      const mapped = TIPO_STAND_MAP[normalizeKey(row.tipo_stand)];
      if (mapped) update.tipo_stand = mapped;
    }
    if (row.medida !== undefined && row.medida !== "") {
      update.tamano = String(row.medida).trim();
    }
    const valorSinIva = toNumberOrNull(row.valor_sin_iva);
    if (valorSinIva !== null) update.valor_sin_iva = valorSinIva;
    const valorConIva = toNumberOrNull(row.valor_con_iva);
    if (valorConIva !== null) update.valor_con_iva = valorConIva;

    if (Object.keys(update).length === 0) {
      results.push({ codigo, ok: true });
      continue;
    }

    const { error, count } = await supabase
      .from("stands")
      .update(update, { count: "exact" })
      .eq("codigo", codigo);

    if (error) {
      results.push({ codigo, ok: false, error: error.message });
    } else if (!count) {
      results.push({
        codigo,
        ok: false,
        error: "código no encontrado en stands",
      });
    } else {
      results.push({ codigo, ok: true });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { "Content-Type": "application/json" },
  });
});
