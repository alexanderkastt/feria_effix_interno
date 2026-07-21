"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Mismos literales que los enums de la base (movimientos_ingresos.origen /
// nivel_sensibilidad): viajan tal cual del formulario a la base, sin mapping.
export type OrigenIngreso = "stand" | "boleteria" | "patrocinio" | "otro";
export type NivelSensibilidad = "resumen" | "detalle" | "personal";

const SIN_PERMISO: AccionResult = {
  ok: false,
  mensaje:
    "No tenés permiso para editar movimientos financieros. Esta acción requiere rol directivo o administrativo (es_admin_global en la base de datos).",
};

// ============================================================================
// Ingresos
// ============================================================================

export interface MovimientoIngresoInput {
  fecha_creacion: string;
  numero_factura: string | null;
  cliente_nombre: string | null;
  cliente_nit: string | null;
  concepto: string | null;
  total_bruto: number | null;
  descuentos: number | null;
  subtotal: number | null;
  impuestos: number | null;
  total_neto: number | null;
  categoria_id: string | null;
  origen: OrigenIngreso;
  subido_a_effisystems: boolean;
  nivel_sensibilidad: NivelSensibilidad;
  revision_pendiente: boolean;
  nota_revision: string | null;
}

function validarIngreso(input: MovimientoIngresoInput): string | null {
  if (!input.fecha_creacion) {
    return "La fecha del movimiento es obligatoria.";
  }
  const origenesValidos: OrigenIngreso[] = [
    "stand",
    "boleteria",
    "patrocinio",
    "otro",
  ];
  if (!origenesValidos.includes(input.origen)) {
    return "El origen del ingreso no es válido.";
  }
  const nivelesValidos: NivelSensibilidad[] = [
    "resumen",
    "detalle",
    "personal",
  ];
  if (!nivelesValidos.includes(input.nivel_sensibilidad)) {
    return "El nivel de sensibilidad no es válido.";
  }
  return null;
}

function filaIngreso(input: MovimientoIngresoInput) {
  return {
    fecha_creacion: input.fecha_creacion,
    numero_factura: input.numero_factura?.trim() || null,
    cliente_nombre: input.cliente_nombre?.trim() || null,
    cliente_nit: input.cliente_nit?.trim() || null,
    concepto: input.concepto?.trim() || null,
    total_bruto: input.total_bruto,
    descuentos: input.descuentos,
    subtotal: input.subtotal,
    impuestos: input.impuestos,
    total_neto: input.total_neto,
    categoria_id: input.categoria_id || null,
    origen: input.origen,
    subido_a_effisystems: input.subido_a_effisystems,
    nivel_sensibilidad: input.nivel_sensibilidad,
    revision_pendiente: input.revision_pendiente,
    nota_revision: input.revision_pendiente
      ? input.nota_revision?.trim() || null
      : null,
  };
}

export async function crearMovimientoIngreso(
  input: MovimientoIngresoInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const errorValidacion = validarIngreso(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_ingresos")
    .insert(filaIngreso(input));

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo crear el ingreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}

export async function actualizarMovimientoIngreso(
  id: string,
  input: MovimientoIngresoInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const errorValidacion = validarIngreso(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_ingresos")
    .update(filaIngreso(input))
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo actualizar el ingreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}

export async function borrarMovimientoIngreso(
  id: string,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_ingresos")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo borrar el ingreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}

// ============================================================================
// Egresos
// ============================================================================

export interface MovimientoEgresoInput {
  fecha: string | null;
  proveedor_nombre: string | null;
  descripcion_servicio: string | null;
  observaciones: string | null;
  rubro_agrupado: string | null;
  subrubro: string | null;
  valor_antes_iva: number | null;
  impuestos: number | null;
  retenciones: number | null;
  total_neto: number | null;
  numero_factura_proveedor: string | null;
  numero_comprobante_effi: string | null;
  lleva_factura_electronica: boolean;
  categoria_id: string | null;
  nivel_sensibilidad: NivelSensibilidad;
  revision_pendiente: boolean;
  nota_revision: string | null;
}

function validarEgreso(input: MovimientoEgresoInput): string | null {
  const nivelesValidos: NivelSensibilidad[] = [
    "resumen",
    "detalle",
    "personal",
  ];
  if (!nivelesValidos.includes(input.nivel_sensibilidad)) {
    return "El nivel de sensibilidad no es válido.";
  }
  return null;
}

function filaEgreso(input: MovimientoEgresoInput) {
  return {
    fecha: input.fecha || null,
    proveedor_nombre: input.proveedor_nombre?.trim() || null,
    descripcion_servicio: input.descripcion_servicio?.trim() || null,
    observaciones: input.observaciones?.trim() || null,
    rubro_agrupado: input.rubro_agrupado?.trim() || null,
    subrubro: input.subrubro?.trim() || null,
    valor_antes_iva: input.valor_antes_iva,
    impuestos: input.impuestos,
    retenciones: input.retenciones,
    total_neto: input.total_neto,
    numero_factura_proveedor: input.numero_factura_proveedor?.trim() || null,
    numero_comprobante_effi: input.numero_comprobante_effi?.trim() || null,
    lleva_factura_electronica: input.lleva_factura_electronica,
    categoria_id: input.categoria_id || null,
    nivel_sensibilidad: input.nivel_sensibilidad,
    revision_pendiente: input.revision_pendiente,
    nota_revision: input.revision_pendiente
      ? input.nota_revision?.trim() || null
      : null,
  };
}

export async function crearMovimientoEgreso(
  input: MovimientoEgresoInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const errorValidacion = validarEgreso(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_egresos")
    .insert(filaEgreso(input));

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo crear el egreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}

export async function actualizarMovimientoEgreso(
  id: string,
  input: MovimientoEgresoInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const errorValidacion = validarEgreso(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_egresos")
    .update(filaEgreso(input))
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo actualizar el egreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}

export async function borrarMovimientoEgreso(
  id: string,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_egresos")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      mensaje: `No se pudo borrar el egreso: ${error.message}`,
    };
  }

  revalidatePath("/panel/finanzas/movimientos");
  return { ok: true };
}
