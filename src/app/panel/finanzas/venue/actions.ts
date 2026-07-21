"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// El literal "CD"/"EA"/"otro" viaja tal cual del formulario a la base: no hay
// ningún mapping/traducción en este archivo ni en el resto del módulo (ver
// unidad_tarifa_venue en la migración — decisión explícita de no adivinar el
// significado sin el contrato).
export type UnidadTarifaVenue = "CD" | "EA" | "otro";

export interface LineaEspacioInput {
  nombre_espacio: string;
  tarifa_unidad: number | null;
  unidad_tarifa: UnidadTarifaVenue;
  unidades: number;
  subtotal: number;
}

export interface NuevoEscenarioVenueInput {
  nombre_escenario: string;
  edicion: string;
  total_bruto: number | null;
  iva: number | null;
  total_neto: number | null;
  incremento_ipc_estimado: number | null;
  lineas: LineaEspacioInput[];
}

const SIN_PERMISO: AccionResult = {
  ok: false,
  mensaje:
    "No tenés permiso para crear escenarios de venue. Esta acción requiere rol directivo o administrativo (es_admin_global en la base de datos).",
};

// Crea un escenario_venue nuevo junto con sus espacios_venue y las líneas
// escenario_venue_espacios que los vinculan. Solo es_admin_global() puede
// insertar (RLS): se valida acá también para devolver un mensaje claro en vez
// de que el usuario vea el botón y reciba un error genérico de Postgres.
export async function crearEscenarioVenue(
  input: NuevoEscenarioVenueInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO;

  const nombreEscenario = input.nombre_escenario.trim();
  const edicion = input.edicion.trim();
  if (!nombreEscenario) {
    return { ok: false, mensaje: "El nombre del escenario es obligatorio." };
  }
  if (!edicion) {
    return { ok: false, mensaje: 'La edición es obligatoria (ej. "2026").' };
  }

  const lineas = input.lineas
    .map((l) => ({ ...l, nombre_espacio: l.nombre_espacio.trim() }))
    .filter((l) => l.nombre_espacio.length > 0);
  if (lineas.length === 0) {
    return {
      ok: false,
      mensaje: "Agregá al menos un espacio con nombre antes de guardar.",
    };
  }
  for (const l of lineas) {
    if (!Number.isFinite(l.unidades) || l.unidades <= 0) {
      return {
        ok: false,
        mensaje: `El espacio "${l.nombre_espacio}" necesita unidades mayores a cero.`,
      };
    }
    if (!Number.isFinite(l.subtotal) || l.subtotal < 0) {
      return {
        ok: false,
        mensaje: `El espacio "${l.nombre_espacio}" tiene un subtotal inválido.`,
      };
    }
    if (
      l.unidad_tarifa !== "CD" &&
      l.unidad_tarifa !== "EA" &&
      l.unidad_tarifa !== "otro"
    ) {
      return {
        ok: false,
        mensaje: `El espacio "${l.nombre_espacio}" tiene una unidad de tarifa inválida.`,
      };
    }
  }

  const supabase = await createClient();

  const { data: escenario, error: errEscenario } = await supabase
    .from("escenarios_venue")
    .insert({
      nombre_escenario: nombreEscenario,
      edicion,
      total_bruto: input.total_bruto,
      iva: input.iva,
      total_neto: input.total_neto,
      incremento_ipc_estimado: input.incremento_ipc_estimado,
    })
    .select("id")
    .single();

  if (errEscenario || !escenario) {
    return {
      ok: false,
      mensaje:
        errEscenario?.message ??
        "No se pudo crear el escenario de venue (respuesta vacía).",
    };
  }

  // Inserción secuencial (no en lote) para poder mapear cada línea al id del
  // espacio recién creado y para poder reportar exactamente cuál línea falló
  // si algo sale mal a mitad de camino.
  for (const linea of lineas) {
    const { data: espacio, error: errEspacio } = await supabase
      .from("espacios_venue")
      .insert({
        nombre_espacio: linea.nombre_espacio,
        tarifa_unidad: linea.tarifa_unidad,
        unidad_tarifa: linea.unidad_tarifa,
        edicion,
      })
      .select("id")
      .single();

    if (errEspacio || !espacio) {
      return {
        ok: false,
        mensaje:
          `El escenario "${nombreEscenario}" se creó, pero falló al guardar ` +
          `el espacio "${linea.nombre_espacio}": ${errEspacio?.message ?? "error desconocido"}. ` +
          "Revisá el escenario en la lista y completá manualmente lo que falte.",
      };
    }

    const { error: errLinea } = await supabase
      .from("escenario_venue_espacios")
      .insert({
        escenario_id: escenario.id,
        espacio_id: espacio.id,
        unidades: linea.unidades,
        subtotal: linea.subtotal,
      });

    if (errLinea) {
      return {
        ok: false,
        mensaje:
          `El escenario "${nombreEscenario}" se creó, pero falló al vincular ` +
          `"${linea.nombre_espacio}": ${errLinea.message}. Revisá el escenario en la lista.`,
      };
    }
  }

  revalidatePath("/panel/finanzas/venue");
  return { ok: true };
}
