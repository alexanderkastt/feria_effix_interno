export type Pabellon =
  | "azul"
  | "amarillo"
  | "blanco"
  | "rojo"
  | "zona_comidas"
  | "burbujas"
  | "gran_salon"
  | "plazoleta"
  | "hall_verde"
  | "hall";

export type TipoStand = "isla" | "tipo_u" | "esquinero" | "lineal";

export type CategoriaCliente =
  | "academia_educacion"
  | "comercializadora_distribuidor"
  | "fabricante"
  | "importaciones"
  | "logistica"
  | "plataforma"
  | "servicios";

export type EstadoVenta =
  | "disponible"
  | "reservado"
  | "pago_100"
  | "sin_pagos"
  | "canje"
  | "obsequio_directivo";

export type MedioPago =
  | "cuenta_banco_effix"
  | "efectivo"
  | "mercado_pago"
  | "payoneer"
  | "trazabilidad_effi"
  | "usdt";

export type FormaPagoRestante =
  | "bimestral_directo"
  | "mensual_directo"
  | "mensual_debito_efficomerce"
  | "solo_un_pago"
  | "ya_pago_totalidad";

export type FrecuenciaParticipacion =
  | "primera_vez"
  | "segunda_vez"
  | "mas_de_tres";

export type TipoPagoStand = "primer_abono" | "abono_adicional" | "pago_final";

export interface StandView {
  id: string;
  codigo: string;
  nombre: string | null;
  tamano: string | null;
  precio: number;
  estado: "disponible" | "bloqueado_temporal" | "reservado" | "vendido";
  cliente_nombre: string | null;
  patrocinador_id: string | null;

  pabellon: Pabellon | null;
  tipo_stand: TipoStand | null;
  categoria_cliente: CategoriaCliente | null;
  asesor_id: string | null;
  asesor_nombre: string | null;
  estado_venta: EstadoVenta | null;
  obsequio_de: string | null;

  valor_sin_iva: number | null;
  valor_con_iva: number | null;
  precio_venta: number | null;
  nombre_fiscal: string | null;
  nombre_persona_encargada: string | null;
  id_effi: string | null;
  ciudad: string | null;

  valor_primer_abono: number | null;
  medio_pago_primer_abono: MedioPago | null;
  forma_pago_restante: FormaPagoRestante | null;
  valor_restante: number;

  pantallazo_aceptacion: boolean;
  aprobacion_tesoreria: boolean;
  facturado: boolean;
  fecha_venta: string | null;
  numero_factura: string | null;
  primera_vez_en_feria: FrecuenciaParticipacion | null;

  contrato_entregado: boolean;
  manual_entregado: boolean;
  logo_recibido: boolean;
  marcado_en_mapa: boolean;
  publicado_web: boolean;
  imagen_enviada: boolean;
  formulario_directorio_lleno: boolean;
  paz_y_salvo: boolean;

  observaciones_venta: string | null;
  observaciones_facturacion: string | null;

  stand_principal_id: string | null;
  token_publico: string;
  logo_url: string | null;
}

export interface PatrocinioOption {
  id: string;
  empresa: string;
}

export interface AsesorOption {
  id: string;
  nombre_completo: string;
}

export interface PagoStandView {
  id: string;
  stand_id: string;
  monto: number;
  fecha: string;
  medio_pago: MedioPago | null;
  tipo_pago: TipoPagoStand | null;
}

export const PABELLON_LABEL: Record<Pabellon, string> = {
  azul: "Azul",
  amarillo: "Amarillo",
  blanco: "Blanco",
  rojo: "Rojo",
  zona_comidas: "Zona de comidas",
  burbujas: "Burbujas",
  gran_salon: "Gran salón",
  plazoleta: "Plazoleta",
  hall_verde: "Hall verde",
  hall: "Hall",
};

export const TIPO_STAND_LABEL: Record<TipoStand, string> = {
  isla: "Isla",
  tipo_u: "Tipo U",
  esquinero: "Esquinero",
  lineal: "Lineal",
};

export const CATEGORIA_LABEL: Record<CategoriaCliente, string> = {
  academia_educacion: "Academia / Educación",
  comercializadora_distribuidor: "Comercializadora / Distribuidor",
  fabricante: "Fabricante",
  importaciones: "Importaciones",
  logistica: "Logística",
  plataforma: "Plataforma",
  servicios: "Servicios",
};

export const ESTADO_VENTA_LABEL: Record<EstadoVenta, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  pago_100: "Pago 100%",
  sin_pagos: "Sin pagos",
  canje: "Canje",
  obsequio_directivo: "Obsequio directivo",
};

export const ESTADO_VENTA_STYLE: Record<EstadoVenta, string> = {
  disponible: "border-border bg-surface-2 text-muted",
  reservado: "border-warn/50 bg-warn/10 text-warn",
  pago_100: "border-ok/50 bg-ok/10 text-ok",
  sin_pagos: "border-danger/50 bg-danger/10 text-danger",
  canje: "border-brand/50 bg-brand-soft/30 text-brand",
  obsequio_directivo: "border-brand/40 bg-brand-soft/20 text-brand",
};

export const MEDIO_PAGO_LABEL: Record<MedioPago, string> = {
  cuenta_banco_effix: "Cuenta banco Effix",
  efectivo: "Efectivo",
  mercado_pago: "Mercado Pago",
  payoneer: "Payoneer",
  trazabilidad_effi: "Trazabilidad Effi",
  usdt: "USDT",
};

export const FORMA_PAGO_LABEL: Record<FormaPagoRestante, string> = {
  bimestral_directo: "Bimestral directo",
  mensual_directo: "Mensual directo",
  mensual_debito_efficomerce: "Mensual débito Efficomerce",
  solo_un_pago: "Solo un pago",
  ya_pago_totalidad: "Ya pagó totalidad",
};

export const FRECUENCIA_LABEL: Record<FrecuenciaParticipacion, string> = {
  primera_vez: "Primera vez",
  segunda_vez: "Segunda vez",
  mas_de_tres: "Más de tres veces",
};

export const TIPO_PAGO_LABEL: Record<TipoPagoStand, string> = {
  primer_abono: "Primer abono",
  abono_adicional: "Abono adicional",
  pago_final: "Pago final",
};

export const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// ---------- Tarifa estándar por m² ------------------------------------------
// Tarifa vigente para stands sin negociación especial: $700.000/m² en general,
// $400.000/m² en la zona de comidas. +19% IVA. Solo aplica para calcular una
// sugerencia de precio en stands que todavía no fueron negociados
// (estado_venta null o 'disponible'): los ya vendidos/reservados NUNCA se
// recalculan automáticamente, se editan a mano si hace falta.
export const TARIFA_M2_ESTANDAR = 700_000;
export const TARIFA_M2_COMIDAS = 400_000;
export const IVA_STANDS = 0.19;

// Interpreta tamaños tipo "4x2" (ancho x profundidad, en metros). Devuelve
// null si el texto no matchea ese patrón (ej. tamaños libres del Excel
// histórico) para que el que calcula el precio decida el fallback.
export function calcularAreaM2(tamano: string | null): number | null {
  if (!tamano) return null;
  const m = tamano
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)$/);
  if (!m) return null;
  const a = Number(m[1].replace(",", "."));
  const b = Number(m[2].replace(",", "."));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a * b;
}

export function tarifaM2Pabellon(pabellon: Pabellon | null): number {
  return pabellon === "zona_comidas" ? TARIFA_M2_COMIDAS : TARIFA_M2_ESTANDAR;
}

// Valor de lista (sin negociación) a partir del tamaño y el pabellón. null si
// el tamaño no se pudo interpretar como "AxB" — en ese caso el precio se
// carga a mano en el formulario, no hay tarifa automática posible.
export function calcularValorEstandar(
  tamano: string | null,
  pabellon: Pabellon | null,
): { valorSinIva: number; valorConIva: number } | null {
  const area = calcularAreaM2(tamano);
  if (area == null) return null;
  const valorSinIva = Math.round(area * tarifaM2Pabellon(pabellon));
  const valorConIva = Math.round(valorSinIva * (1 + IVA_STANDS));
  return { valorSinIva, valorConIva };
}
