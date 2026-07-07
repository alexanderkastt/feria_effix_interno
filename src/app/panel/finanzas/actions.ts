"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

type FuenteIngreso = "boleteria" | "stands" | "patrocinios" | "otros";
type EstadoIngreso = "proyectado" | "confirmado" | "cobrado";
type CategoriaGasto =
  | "produccion"
  | "logistica"
  | "marketing"
  | "talento"
  | "tecnologia"
  | "alianzas"
  | "otros";
type EstadoGasto = "presupuestado" | "aprobado" | "pagado";

// Registrar un ingreso manual. RLS: requiere edición del área 'finanzas'.
export async function registrarIngreso(input: {
  fuente: FuenteIngreso;
  concepto: string;
  monto: number;
  estado: EstadoIngreso;
  fecha: string;
}): Promise<AccionResult> {
  const concepto = input.concepto.trim();
  if (concepto.length < 2) return { ok: false, mensaje: "Falta el concepto." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("ingresos").insert({
    fuente: input.fuente,
    concepto,
    monto: input.monto || 0,
    estado: input.estado,
    fecha: input.fecha || undefined,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/finanzas");
  return { ok: true };
}

// Solicitar un gasto (queda 'presupuestado'). Cualquier gestor de su área.
// RLS exige estado='presupuestado' + edición del área.
export async function solicitarGasto(input: {
  categoria: CategoriaGasto;
  concepto: string;
  monto: number;
  proveedor: string;
  areaSlug: string;
}): Promise<AccionResult> {
  const concepto = input.concepto.trim();
  if (concepto.length < 2) return { ok: false, mensaje: "Falta el concepto." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: area } = await supabase
    .from("areas")
    .select("id")
    .eq("nombre", input.areaSlug)
    .single();

  const { error } = await supabase.from("gastos").insert({
    categoria: input.categoria,
    concepto,
    monto: input.monto || 0,
    proveedor: input.proveedor.trim() || null,
    estado: "presupuestado",
    area_id: area?.id ?? null,
    creado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/finanzas");
  return { ok: true };
}

// Aprobar/pagar un gasto. RLS: solo directivo/administrativo puede hacer UPDATE.
export async function cambiarEstadoGasto(
  id: string,
  estado: EstadoGasto,
): Promise<AccionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("gastos")
    .update({
      estado,
      aprobado_por: estado === "presupuestado" ? null : (user?.id ?? null),
    })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/finanzas");
  return { ok: true };
}
