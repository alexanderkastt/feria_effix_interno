// Recibe celdas editadas en el Google Sheet "STANDS 2026" (vía Apps Script)
// y actualiza en `stands` SOLO los campos que vienen en el payload — Apps
// Script manda únicamente las columnas que realmente se acaban de editar en
// ese evento puntual (no toda la fila), así editar una columna no reenvía
// de rebote un valor viejo de otra columna que quedó desactualizada en el
// Sheet y pisa algo cargado después desde el panel.
//
// NUNCA se sincronizan (quedan exclusivamente calculadas/gestionadas por la
// plataforma): total, vr_abonos, valor_restante (los recalcula un trigger a
// partir de pagos_stand — si el Sheet los pisara quedarían mal).
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

const CATEGORIA_MAP: Record<string, string> = {
  "ACADEMIA EDUCACION": "academia_educacion",
  IMPORTACIONES: "importaciones",
  "COMERCIALIZADORA DISTRIBUIDOR": "comercializadora_distribuidor",
  FABRICANTE: "fabricante",
  SERVICIOS: "servicios",
  LOGISTICA: "logistica",
  PLATAFORMA: "plataforma",
};

const ESTADO_VENTA_MAP: Record<string, string> = {
  DISPONIBLE: "disponible",
  RESERVADO: "reservado",
  "PAGO EL 100%": "pago_100",
  "SIN PAGOS": "sin_pagos",
  CANJE: "canje",
  "OBSEQUIO DIRECTIVO": "obsequio_directivo",
};

const MEDIO_PAGO_MAP: Record<string, string> = {
  "CUENTA BANCO EFFIX": "cuenta_banco_effix",
  EFECTIVO: "efectivo",
  "MERCADO PAGO": "mercado_pago",
  PAYONEER: "payoneer",
  "TRAZABILIDAD EFFI": "trazabilidad_effi",
  USDT: "usdt",
};

const FORMA_PAGO_RESTANTE_MAP: Record<string, string> = {
  "BIMESTRAL ABONO DIRECTO": "bimestral_directo",
  "MENSUAL ABONO DIRECTO": "mensual_directo",
  "MENSUAL DEBITO EFFICOMERCE": "mensual_debito_efficomerce",
  "SOLO UN PAGO": "solo_un_pago",
  "YA PAGO LA TOTALIDAD": "ya_pago_totalidad",
  "YA PAGO TOTALIDAD": "ya_pago_totalidad",
};

const PRIMERA_VEZ_MAP: Record<string, string> = {
  "PRIMERA VEZ": "primera_vez",
  "SEGUNDA VEZ": "segunda_vez",
  "MAS DE TRES": "mas_de_tres",
  "TERCERA VEZ O MAS": "mas_de_tres",
};

// Campos con enum/mapa fijo cuyo texto en el Sheet puede variar un poco.
// Si el valor no matchea ninguna clave conocida, simplemente se ignora ese
// campo puntual (no se escribe nada raro ni se corta el resto del update).
function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[/\-.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DIACRITICOS = new RegExp("[̀-ͯ]", "g");
function stripAccents(value: string): string {
  return value.normalize("NFD").replace(DIACRITICOS, "");
}

function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toTextOrNull(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return null;
  return String(value).trim();
}

const MARCADORES_VERDADEROS = ["1", "TRUE", "SI", "SÍ", "CHECK", "X"];
function toBoolOrNull(value: unknown): boolean | null {
  if (value === "" || value === null || value === undefined) return null;
  return MARCADORES_VERDADEROS.includes(normalizeKey(value));
}

// El Sheet manda la fecha ya formateada como "yyyy-MM-dd" (Apps Script la
// formatea con el timezone del Sheet antes de mandarla) — acá solo se valida
// que tenga esa forma para no guardar basura en una columna `date`.
function toDateOrNull(value: unknown): string | null {
  if (value === "" || value === null || value === undefined) return null;
  const texto = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
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

  // Catálogo de asesores en memoria (tabla chica, se resuelve una sola vez
  // por invocación) para mapear el nombre de texto del Sheet a asesor_id.
  const { data: asesores } = await supabase
    .from("asesores_comerciales")
    .select("id, nombre_completo");
  const asesorPorNombre = new Map<string, string>();
  for (const a of asesores ?? []) {
    asesorPorNombre.set(stripAccents(normalizeKey(a.nombre_completo)), a.id);
  }

  const results: Array<{ codigo: string; ok: boolean; error?: string }> = [];

  for (const row of body.rows) {
    const codigo = String(row.codigo ?? "").trim();
    if (!codigo) continue;

    const update: Record<string, unknown> = {};

    if (row.pabellon !== undefined) {
      const mapped = PABELLON_MAP[normalizeKey(row.pabellon)];
      if (mapped) update.pabellon = mapped;
    }
    if (row.tipoStand !== undefined) {
      const mapped = TIPO_STAND_MAP[normalizeKey(row.tipoStand)];
      if (mapped) update.tipo_stand = mapped;
    }
    if (row.medida !== undefined) {
      const v = toTextOrNull(row.medida);
      if (v !== null) update.tamano = v;
    }
    if (row.nombre !== undefined) {
      const v = toTextOrNull(row.nombre);
      if (v !== null) update.nombre = v;
    }
    if (row.valorSinIva !== undefined) {
      const v = toNumberOrNull(row.valorSinIva);
      if (v !== null) update.valor_sin_iva = v;
    }
    if (row.valorConIva !== undefined) {
      const v = toNumberOrNull(row.valorConIva);
      if (v !== null) update.valor_con_iva = v;
    }
    if (row.precioVenta !== undefined) {
      const v = toNumberOrNull(row.precioVenta);
      if (v !== null) update.precio_venta = v;
    }
    if (row.nombreFiscal !== undefined) {
      const v = toTextOrNull(row.nombreFiscal);
      if (v !== null) update.nombre_fiscal = v;
    }
    if (row.nombrePersonaEncargada !== undefined) {
      const v = toTextOrNull(row.nombrePersonaEncargada);
      if (v !== null) update.nombre_persona_encargada = v;
    }
    if (row.numeroContacto !== undefined) {
      const v = toTextOrNull(row.numeroContacto);
      if (v !== null) update.directorio_telefono = v;
    }
    if (row.idEffi !== undefined) {
      const v = toTextOrNull(row.idEffi);
      if (v !== null) update.id_effi = v;
    }
    if (row.ciudad !== undefined) {
      const v = toTextOrNull(row.ciudad);
      if (v !== null) update.ciudad = v;
    }
    if (row.categoria !== undefined) {
      const mapped = CATEGORIA_MAP[normalizeKey(row.categoria)];
      if (mapped) update.categoria_cliente = mapped;
    }
    if (row.asesor !== undefined) {
      const id = asesorPorNombre.get(stripAccents(normalizeKey(row.asesor)));
      if (id) update.asesor_id = id;
    }
    if (row.reserva !== undefined) {
      const mapped = ESTADO_VENTA_MAP[normalizeKey(row.reserva)];
      if (mapped) update.estado_venta = mapped;
    }
    if (row.medioPagoPrimerAbono !== undefined) {
      const mapped = MEDIO_PAGO_MAP[normalizeKey(row.medioPagoPrimerAbono)];
      if (mapped) update.medio_pago_primer_abono = mapped;
    }
    if (row.formaPagoRestante !== undefined) {
      const mapped =
        FORMA_PAGO_RESTANTE_MAP[normalizeKey(row.formaPagoRestante)];
      if (mapped) update.forma_pago_restante = mapped;
    }
    if (row.pantallazoAceptacion !== undefined) {
      const v = toBoolOrNull(row.pantallazoAceptacion);
      if (v !== null) update.pantallazo_aceptacion = v;
    }
    if (row.aprobacionTesoreria !== undefined) {
      const v = toBoolOrNull(row.aprobacionTesoreria);
      if (v !== null) update.aprobacion_tesoreria = v;
    }
    if (row.fechaVenta !== undefined) {
      const v = toDateOrNull(row.fechaVenta);
      if (v !== null) update.fecha_venta = v;
    }
    if (row.observacionesVenta !== undefined) {
      const v = toTextOrNull(row.observacionesVenta);
      if (v !== null) update.observaciones_venta = v;
    }
    if (row.primeraVez !== undefined) {
      const mapped = PRIMERA_VEZ_MAP[normalizeKey(row.primeraVez)];
      if (mapped) update.primera_vez_en_feria = mapped;
    }
    if (row.facturado !== undefined) {
      const v = toBoolOrNull(row.facturado);
      if (v !== null) update.facturado = v;
    }
    if (row.numeroFactura !== undefined) {
      const v = toTextOrNull(row.numeroFactura);
      if (v !== null) update.numero_factura = v;
    }
    if (row.observacionesFacturacion !== undefined) {
      const v = toTextOrNull(row.observacionesFacturacion);
      if (v !== null) update.observaciones_facturacion = v;
    }
    if (row.contrato !== undefined) {
      const v = toBoolOrNull(row.contrato);
      if (v !== null) update.contrato_entregado = v;
    }
    if (row.manual !== undefined) {
      const v = toBoolOrNull(row.manual);
      if (v !== null) update.manual_entregado = v;
    }
    if (row.logo !== undefined) {
      const v = toBoolOrNull(row.logo);
      if (v !== null) update.logo_recibido = v;
    }
    if (row.marcadoMapa !== undefined) {
      const v = toBoolOrNull(row.marcadoMapa);
      if (v !== null) update.marcado_en_mapa = v;
    }
    if (row.publicado !== undefined) {
      const v = toBoolOrNull(row.publicado);
      if (v !== null) update.publicado_web = v;
    }
    if (row.imagenEnviada !== undefined) {
      const v = toBoolOrNull(row.imagenEnviada);
      if (v !== null) update.imagen_enviada = v;
    }
    if (row.formularioDirectorio !== undefined) {
      const v = toBoolOrNull(row.formularioDirectorio);
      if (v !== null) update.formulario_directorio_lleno = v;
    }
    if (row.pazYSalvo !== undefined) {
      const v = toBoolOrNull(row.pazYSalvo);
      if (v !== null) update.paz_y_salvo = v;
    }

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
