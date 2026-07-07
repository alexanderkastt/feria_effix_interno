"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ReservaResult {
  ok: boolean;
  mensaje?: string;
  bloqueadoHasta?: string;
}

const MIN_30 = 30 * 60 * 1000;

function limpiar(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

// Libera los bloqueos temporales vencidos (llamado al cargar el mapa).
export async function liberarVencidos() {
  const admin = createAdminClient();
  await admin.rpc("liberar_stands_vencidos");
}

// Bloquea un stand disponible por 30 min. Update condicional (estado='disponible')
// → maneja la condición de carrera: si dos personas reservan a la vez, solo una gana.
export async function reservarStand(id: string): Promise<ReservaResult> {
  const admin = createAdminClient();
  await admin.rpc("liberar_stands_vencidos");

  const bloqueadoHasta = new Date(Date.now() + MIN_30).toISOString();
  const { data, error } = await admin
    .from("stands")
    .update({ estado: "bloqueado_temporal", bloqueado_hasta: bloqueadoHasta })
    .eq("id", id)
    .eq("estado", "disponible")
    .select("id");

  if (error) return { ok: false, mensaje: "No se pudo reservar el stand." };
  if (!data || data.length === 0) {
    return { ok: false, mensaje: "Ese stand ya fue tomado. Elegí otro." };
  }
  revalidatePath("/mapa-stands");
  return { ok: true, bloqueadoHasta };
}

// Confirma la reserva con los datos del cliente. Valida que siga bloqueado y sin vencer.
export async function confirmarReserva(input: {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}): Promise<ReservaResult> {
  const nombre = limpiar(input.nombre);
  const email = limpiar(input.email);
  const telefono = limpiar(input.telefono);
  if (nombre.length < 3 || !email.includes("@") || telefono.length < 6) {
    return {
      ok: false,
      mensaje: "Completá nombre, correo y teléfono válidos.",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stands")
    .update({
      estado: "reservado",
      cliente_nombre: nombre,
      cliente_email: email,
      cliente_telefono: telefono,
    })
    .eq("id", input.id)
    .eq("estado", "bloqueado_temporal")
    .gt("bloqueado_hasta", new Date().toISOString())
    .select("id, codigo");

  if (error) return { ok: false, mensaje: "No se pudo confirmar la reserva." };
  if (!data || data.length === 0) {
    return {
      ok: false,
      mensaje: "El bloqueo de 30 min expiró. Volvé a intentar la reserva.",
    };
  }

  // Crear tarea transversal para stands + finanzas (seguimiento comercial).
  const { data: areas } = await admin
    .from("areas")
    .select("id, nombre")
    .in("nombre", ["stands", "finanzas"]);
  const ids = (areas ?? []).map((a) => a.id);

  await admin.from("tareas_transversales").insert({
    titulo: `Seguimiento reserva stand ${data[0].codigo} — ${nombre}`,
    descripcion: `Cliente: ${nombre} · ${email} · ${telefono}`,
    areas_involucradas: ids,
    prioridad: "alta",
  });

  revalidatePath("/mapa-stands");
  return { ok: true };
}
