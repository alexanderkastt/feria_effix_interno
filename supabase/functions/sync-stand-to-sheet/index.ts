// Empuja cambios de `stands` hacia el Google Sheet "STANDS 2026", en sentido
// contrario a supabase/functions/sync-stand-from-sheet. Lo dispara un trigger
// de Postgres (ver migración stands_sync_a_sheet) cada vez que cambia alguno
// de los campos que también viven en el Sheet.
//
// Escribe con la API de Sheets usando una cuenta de servicio (no Apps
// Script): así la escritura NO dispara el onEdit del Sheet y no hay loop
// infinito Sheet -> Plataforma -> Sheet -> ...
import { createClient } from "npm:@supabase/supabase-js@2";

const SHEET_NAME = "STANDS 2026";

const COL_LETRA: Record<string, number> = {
  pabellon: 2,
  tamano: 4,
  tipo_stand: 5,
  valor_sin_iva: 6,
  valor_con_iva: 7,
  precio_venta: 9,
  nombre: 10,
  nombre_fiscal: 11,
  nombre_persona_encargada: 12,
  directorio_telefono: 13,
  id_effi: 14,
  ciudad: 15,
  categoria_cliente: 16,
  asesor_nombre: 17,
  estado_venta: 18,
  medio_pago_primer_abono: 22,
  forma_pago_restante: 23,
  pantallazo_aceptacion: 24,
  aprobacion_tesoreria: 25,
  fecha_venta: 26,
  observaciones_venta: 27,
  primera_vez_en_feria: 28,
  facturado: 29,
  numero_factura: 30,
  observaciones_facturacion: 31,
  contrato_entregado: 32,
  manual_entregado: 33,
  logo_recibido: 34,
  marcado_en_mapa: 35,
  publicado_web: 36,
  imagen_enviada: 37,
  formulario_directorio_lleno: 38,
  paz_y_salvo: 39,
};

const PABELLON_REVERSO: Record<string, string> = {
  azul: "AZUL",
  amarillo: "AMARILLO",
  blanco: "BLANCO",
  rojo: "ROJO",
  zona_comidas: "ZONA DE COMIDAS",
  burbujas: "BURBUJAS",
  gran_salon: "GRAN SALON",
  plazoleta: "PLAZOLETA",
  hall_verde: "HALL VERDE",
  hall: "HALL",
};

const TIPO_STAND_REVERSO: Record<string, string> = {
  isla: "Isla",
  tipo_u: "Tipo U",
  esquinero: "Esquinero",
  lineal: "Lineal",
};

const CATEGORIA_REVERSO: Record<string, string> = {
  academia_educacion: "Academia /Educacion",
  comercializadora_distribuidor: "Comercializadora -Distribuidor",
  fabricante: "Fabricante",
  importaciones: "Importaciones",
  logistica: "Logistica",
  plataforma: "Plataforma",
  servicios: "Servicios",
};

const ESTADO_VENTA_REVERSO: Record<string, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  pago_100: "Pago el 100%",
  sin_pagos: "Sin pagos",
  canje: "Canje",
  obsequio_directivo: "Obsequio directivo",
};

const MEDIO_PAGO_REVERSO: Record<string, string> = {
  cuenta_banco_effix: "Cuenta Banco Effix",
  efectivo: "Efectivo",
  mercado_pago: "Mercado Pago",
  payoneer: "Payoneer",
  trazabilidad_effi: "Trazabilidad Effi",
  usdt: "USDT",
};

const FORMA_PAGO_REVERSO: Record<string, string> = {
  bimestral_directo: "Bimestral abono directo",
  mensual_directo: "Mensual abono directo",
  mensual_debito_efficomerce: "Mensual debito Efficomercio",
  solo_un_pago: "Solo un pago",
  ya_pago_totalidad: "Ya pago la totalidad",
};

const PRIMERA_VEZ_REVERSO: Record<string, string> = {
  primera_vez: "Primera vez",
  segunda_vez: "Segunda vez",
  mas_de_tres: "Mas de tres",
};

// Cada checklist booleano del Excel original usa su propia convención de
// texto ("1"/"0", "Check"/vacío, "Si"/vacío) — se respeta tal cual para no
// romper los filtros/fórmulas que ya existan en el Sheet sobre esas columnas.
const CAMPOS_BOOL_CHECK: Record<string, [string, string]> = {
  facturado: ["Check", ""],
  aprobacion_tesoreria: ["Si", ""],
};
const CAMPOS_BOOL_UNO_CERO = new Set([
  "pantallazo_aceptacion",
  "contrato_entregado",
  "manual_entregado",
  "logo_recibido",
  "marcado_en_mapa",
  "publicado_web",
  "imagen_enviada",
  "formulario_directorio_lleno",
  "paz_y_salvo",
]);

const DIACRITICOS = new RegExp("[̀-ͯ]", "g");
function stripAccents(value: string): string {
  return value.normalize("NFD").replace(DIACRITICOS, "");
}

function columnaALetra(col: number): string {
  let letra = "";
  let n = col;
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra;
}

async function obtenerAccessToken(): Promise<string> {
  const email = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL")!;
  const privateKeyPem = Deno.env
    .get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY")!
    .replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const unsigned = `${base64url(header)}.${base64url(claim)}`;

  const pemBody = privateKeyPem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned),
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const jwt = `${unsigned}.${signatureB64}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`No se pudo obtener access_token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function buscarFila(
  accessToken: string,
  sheetId: string,
  codigo: string,
): Promise<number | null> {
  const rango = encodeURIComponent(`${SHEET_NAME}!C2:C400`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${rango}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await resp.json();
  const valores: string[][] = data.values ?? [];
  const idx = valores.findIndex((fila) => (fila[0] ?? "").trim() === codigo);
  return idx === -1 ? null : idx + 2;
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
  const codigo = String(body?.codigo ?? "").trim();
  if (!codigo) {
    return new Response(JSON.stringify({ error: "falta codigo" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Si viene asesor_id, resolvemos el nombre para escribirlo en el Sheet
  // (el Sheet muestra nombres, no UUIDs).
  let asesorNombre: string | null = null;
  if (body.asesor_id) {
    const { data: asesor } = await supabase
      .from("asesores_comerciales")
      .select("nombre_completo")
      .eq("id", body.asesor_id)
      .maybeSingle();
    if (asesor)
      asesorNombre = stripAccents(asesor.nombre_completo).toUpperCase();
  }

  const valoresParaSheet: Record<string, string> = {};
  for (const campo of Object.keys(COL_LETRA)) {
    if (campo === "asesor_nombre") {
      if (asesorNombre !== null) valoresParaSheet.asesor_nombre = asesorNombre;
      continue;
    }
    if (!(campo in body) || body[campo] === null || body[campo] === undefined) {
      continue;
    }
    const valor = body[campo];

    if (campo === "pabellon")
      valoresParaSheet[campo] = PABELLON_REVERSO[valor] ?? "";
    else if (campo === "tipo_stand")
      valoresParaSheet[campo] = TIPO_STAND_REVERSO[valor] ?? "";
    else if (campo === "categoria_cliente")
      valoresParaSheet[campo] = CATEGORIA_REVERSO[valor] ?? "";
    else if (campo === "estado_venta")
      valoresParaSheet[campo] = ESTADO_VENTA_REVERSO[valor] ?? "";
    else if (campo === "medio_pago_primer_abono")
      valoresParaSheet[campo] = MEDIO_PAGO_REVERSO[valor] ?? "";
    else if (campo === "forma_pago_restante")
      valoresParaSheet[campo] = FORMA_PAGO_REVERSO[valor] ?? "";
    else if (campo === "primera_vez_en_feria")
      valoresParaSheet[campo] = PRIMERA_VEZ_REVERSO[valor] ?? "";
    else if (campo in CAMPOS_BOOL_CHECK) {
      const [siTexto, noTexto] = CAMPOS_BOOL_CHECK[campo];
      valoresParaSheet[campo] = valor ? siTexto : noTexto;
    } else if (CAMPOS_BOOL_UNO_CERO.has(campo)) {
      valoresParaSheet[campo] = valor ? "1" : "0";
    } else if (campo === "fecha_venta") {
      valoresParaSheet[campo] = String(valor).slice(0, 10);
    } else {
      valoresParaSheet[campo] = String(valor);
    }
  }

  if (Object.keys(valoresParaSheet).length === 0) {
    return new Response(JSON.stringify({ ok: true, sinCambios: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const sheetId = Deno.env.get("GOOGLE_SHEET_ID")!;
  const accessToken = await obtenerAccessToken();
  const fila = await buscarFila(accessToken, sheetId, codigo);
  if (fila === null) {
    return new Response(
      JSON.stringify({ ok: false, error: "código no encontrado en el Sheet" }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const data = Object.entries(valoresParaSheet).map(([campo, valor]) => ({
    range: `${SHEET_NAME}!${columnaALetra(COL_LETRA[campo])}${fila}`,
    values: [[valor]],
  }));

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
    },
  );

  if (!resp.ok) {
    const err = await resp.text();
    return new Response(JSON.stringify({ ok: false, error: err }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, fila }), {
    headers: { "Content-Type": "application/json" },
  });
});
