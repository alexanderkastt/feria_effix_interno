"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

type TipoCategoria = "ingreso" | "egreso";
type NivelSensibilidad = "resumen" | "detalle" | "personal";

const SIN_PERMISO_CATEGORIA: AccionResult = {
  ok: false,
  mensaje:
    "No tenés permiso para crear/editar/borrar categorías de presupuesto. " +
    "Esta acción requiere rol directivo o administrativo (es_admin_global en la base de datos).",
};

const SIN_PERMISO_LINEA: AccionResult = {
  ok: false,
  mensaje:
    "No tenés permiso para crear/editar/borrar líneas de presupuesto. " +
    "Esta acción requiere rol directivo o administrativo (es_admin_global en la base de datos).",
};

function idEsSintetico(id: string): boolean {
  return id.startsWith("nomina-equipo::");
}

/* ============================================================================
 * Categorías
 * ========================================================================= */

export interface CategoriaInput {
  nombre: string;
  tipo: TipoCategoria;
  /** null = categoría raíz. */
  parent_id: string | null;
  /** null = transversal, sin área asociada. */
  area_id: string | null;
}

export async function crearCategoria(
  input: CategoriaInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_CATEGORIA;

  const nombre = input.nombre.trim();
  if (!nombre) {
    return { ok: false, mensaje: "El nombre de la categoría es obligatorio." };
  }
  if (input.tipo !== "ingreso" && input.tipo !== "egreso") {
    return { ok: false, mensaje: "El tipo debe ser ingreso o egreso." };
  }

  const supabase = await createClient();

  // El tipo de una subcategoría SIEMPRE debe coincidir con el de su padre
  // (lo exige categorias_presupuesto_valida_jerarquia_trg). En vez de confiar
  // en que el formulario mandó el tipo correcto, lo recalculamos acá desde el
  // padre real — así una carrera de datos (padre cambiado por otra pestaña)
  // nunca dispara la excepción del trigger por una desincronización de la UI.
  let tipoFinal = input.tipo;
  if (input.parent_id) {
    const { data: padre, error: errPadre } = await supabase
      .from("categorias_presupuesto")
      .select("tipo, parent_id")
      .eq("id", input.parent_id)
      .maybeSingle();

    if (errPadre || !padre) {
      return {
        ok: false,
        mensaje: `La categoría padre seleccionada ya no existe: ${errPadre?.message ?? "no encontrada"}.`,
      };
    }
    if (padre.parent_id !== null) {
      return {
        ok: false,
        mensaje:
          "La categoría padre elegida ya es una subcategoría. La jerarquía es de un solo nivel: elegí una categoría raíz como padre.",
      };
    }
    tipoFinal = padre.tipo as TipoCategoria;
  }

  const { error } = await supabase.from("categorias_presupuesto").insert({
    nombre,
    tipo: tipoFinal,
    parent_id: input.parent_id,
    area_id: input.area_id,
  });

  if (error) {
    // Si de todas formas el trigger de la base rechaza la jerarquía (carrera
    // de datos, o cualquier otro chequeo futuro), se muestra tal cual: no se
    // esconde el mensaje del servidor.
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}

export async function actualizarCategoria(
  id: string,
  input: CategoriaInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_CATEGORIA;

  const nombre = input.nombre.trim();
  if (!nombre) {
    return { ok: false, mensaje: "El nombre de la categoría es obligatorio." };
  }

  const supabase = await createClient();

  const { data: actual, error: errActual } = await supabase
    .from("categorias_presupuesto")
    .select("id, tipo, parent_id")
    .eq("id", id)
    .maybeSingle();

  if (errActual || !actual) {
    return {
      ok: false,
      mensaje: `No se pudo cargar la categoría a editar: ${errActual?.message ?? "no encontrada"}.`,
    };
  }

  const [{ count: lineasCount }, { count: subcategoriasCount }] =
    await Promise.all([
      supabase
        .from("lineas_presupuesto")
        .select("id", { count: "exact", head: true })
        .eq("categoria_id", id),
      supabase
        .from("categorias_presupuesto")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", id),
    ]);

  // El tipo no es editable si ya tiene líneas propias: cambiarlo dejaría esas
  // líneas "colgando" bajo una categoría de tipo distinto sin ningún error
  // de la base que lo detecte (el trigger valida jerarquía, no consistencia
  // retroactiva con lineas_presupuesto).
  if (input.tipo !== actual.tipo && (lineasCount ?? 0) > 0) {
    return {
      ok: false,
      mensaje: `No se puede cambiar el tipo: esta categoría tiene ${lineasCount} línea(s) de presupuesto asociada(s). Movelas o borralas primero.`,
    };
  }
  // Tampoco si tiene subcategorías: el trigger exige que cada subcategoría
  // comparta el tipo del padre, pero solo lo revalida cuando SE TOCA la
  // subcategoría, no cuando se cambia el padre — cambiar el tipo acá dejaría
  // subcategorías con un tipo inconsistente sin que nada lo marque.
  if (input.tipo !== actual.tipo && (subcategoriasCount ?? 0) > 0) {
    return {
      ok: false,
      mensaje: `No se puede cambiar el tipo: esta categoría tiene ${subcategoriasCount} subcategoría(s). Cambiá el tipo de cada subcategoría primero (o movelas).`,
    };
  }

  // Convertir en subcategoría (asignarle parent_id) una categoría que ya
  // tiene subcategorías propias crearía una jerarquía de dos niveles que el
  // trigger no detecta al actualizar ESTA fila (solo mira el padre elegido,
  // no los hijos existentes de esta categoría).
  if (
    input.parent_id !== actual.parent_id &&
    input.parent_id !== null &&
    (subcategoriasCount ?? 0) > 0
  ) {
    return {
      ok: false,
      mensaje: `No se puede convertir en subcategoría: esta categoría ya tiene ${subcategoriasCount} subcategoría(s) propia(s). La jerarquía es de un solo nivel.`,
    };
  }

  let tipoFinal = input.tipo;
  if (input.parent_id) {
    const { data: padre, error: errPadre } = await supabase
      .from("categorias_presupuesto")
      .select("tipo, parent_id")
      .eq("id", input.parent_id)
      .maybeSingle();

    if (errPadre || !padre) {
      return {
        ok: false,
        mensaje: `La categoría padre seleccionada ya no existe: ${errPadre?.message ?? "no encontrada"}.`,
      };
    }
    if (padre.parent_id !== null) {
      return {
        ok: false,
        mensaje:
          "La categoría padre elegida ya es una subcategoría. La jerarquía es de un solo nivel: elegí una categoría raíz como padre.",
      };
    }
    tipoFinal = padre.tipo as TipoCategoria;
  }

  const { error } = await supabase
    .from("categorias_presupuesto")
    .update({
      nombre,
      tipo: tipoFinal,
      parent_id: input.parent_id,
      area_id: input.area_id,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}

export async function borrarCategoria(id: string): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_CATEGORIA;

  const supabase = await createClient();

  // categorias_presupuesto.parent_id y lineas_presupuesto.categoria_id son
  // "on delete restrict": Postgres rechaza el borrado si hay líneas o
  // subcategorías dependientes. Se chequea ACÁ antes de intentar el delete
  // para poder mostrar un mensaje claro con la cantidad exacta, en vez del
  // error genérico de violación de FK de Postgres.
  const [{ count: lineasCount }, { count: subcategoriasCount }] =
    await Promise.all([
      supabase
        .from("lineas_presupuesto")
        .select("id", { count: "exact", head: true })
        .eq("categoria_id", id),
      supabase
        .from("categorias_presupuesto")
        .select("id", { count: "exact", head: true })
        .eq("parent_id", id),
    ]);

  if ((lineasCount ?? 0) > 0 || (subcategoriasCount ?? 0) > 0) {
    const partes: string[] = [];
    if ((lineasCount ?? 0) > 0) partes.push(`${lineasCount} línea(s)`);
    if ((subcategoriasCount ?? 0) > 0)
      partes.push(`${subcategoriasCount} subcategoría(s)`);
    return {
      ok: false,
      mensaje: `No se puede borrar: tiene ${partes.join(" y ")}. Moveelas o borralas primero.`,
    };
  }

  const { error } = await supabase
    .from("categorias_presupuesto")
    .delete()
    .eq("id", id);

  if (error) {
    // Backstop por si hubo una carrera de datos entre el chequeo de arriba y
    // el delete (alguien creó una línea/subcategoría en el medio).
    if (error.code === "23503") {
      return {
        ok: false,
        mensaje:
          "No se puede borrar: se creó una línea o subcategoría nueva justo antes de borrar. Volvé a intentar.",
      };
    }
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}

/* ============================================================================
 * Líneas de presupuesto
 * ========================================================================= */

export interface LineaInput {
  categoria_id: string;
  concepto: string;
  valor_estimado_actual: number;
  valor_real_anio_anterior: number | null;
  cantidad: number | null;
  edicion: string;
  observaciones: string | null;
  nivel_sensibilidad: NivelSensibilidad;
}

function validarLineaInput(input: LineaInput): string | null {
  if (!input.categoria_id) return "Elegí una categoría.";
  if (!input.concepto.trim()) return "El concepto es obligatorio.";
  if (!input.edicion.trim()) return 'La edición es obligatoria (ej. "2026").';
  if (!Number.isFinite(input.valor_estimado_actual)) {
    return "El valor estimado actual debe ser un número.";
  }
  if (
    input.valor_real_anio_anterior !== null &&
    !Number.isFinite(input.valor_real_anio_anterior)
  ) {
    return "El valor real del año anterior debe ser un número (o dejarlo vacío).";
  }
  if (input.cantidad !== null && !Number.isFinite(input.cantidad)) {
    return "La cantidad debe ser un número (o dejarla vacía).";
  }
  if (
    input.nivel_sensibilidad !== "resumen" &&
    input.nivel_sensibilidad !== "detalle" &&
    input.nivel_sensibilidad !== "personal"
  ) {
    return "El nivel de sensibilidad no es válido.";
  }
  return null;
}

export async function crearLinea(input: LineaInput): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_LINEA;

  const errorValidacion = validarLineaInput(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();

  // area_id NO se setea acá a propósito: lineas_presupuesto_sync_area_trg la
  // recalcula siempre desde categoria_id.
  const { error } = await supabase.from("lineas_presupuesto").insert({
    categoria_id: input.categoria_id,
    concepto: input.concepto.trim(),
    valor_estimado_actual: input.valor_estimado_actual,
    valor_real_anio_anterior: input.valor_real_anio_anterior,
    cantidad: input.cantidad,
    edicion: input.edicion.trim(),
    observaciones: input.observaciones?.trim() || null,
    nivel_sensibilidad: input.nivel_sensibilidad,
  });

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}

export async function actualizarLinea(
  id: string,
  input: LineaInput,
): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_LINEA;

  if (idEsSintetico(id)) {
    return {
      ok: false,
      mensaje:
        'No se puede editar "Nómina Equipo": es un renglón agregado, no una línea real. Editá las líneas individuales.',
    };
  }

  const errorValidacion = validarLineaInput(input);
  if (errorValidacion) return { ok: false, mensaje: errorValidacion };

  const supabase = await createClient();

  const { error } = await supabase
    .from("lineas_presupuesto")
    .update({
      categoria_id: input.categoria_id,
      concepto: input.concepto.trim(),
      valor_estimado_actual: input.valor_estimado_actual,
      valor_real_anio_anterior: input.valor_real_anio_anterior,
      cantidad: input.cantidad,
      edicion: input.edicion.trim(),
      observaciones: input.observaciones?.trim() || null,
      nivel_sensibilidad: input.nivel_sensibilidad,
    })
    .eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}

export async function borrarLinea(id: string): Promise<AccionResult> {
  const sesion = await getSesion();
  if (!sesion) return { ok: false, mensaje: "Tu sesión no es válida." };
  if (!sesion.esAdmin) return SIN_PERMISO_LINEA;

  if (idEsSintetico(id)) {
    return {
      ok: false,
      mensaje:
        'No se puede borrar "Nómina Equipo": es un renglón agregado, no una línea real. Borrá las líneas individuales.',
    };
  }

  const supabase = await createClient();

  // Sin restricciones de FK del lado de la base para esta tabla: no hace
  // falta ningún chequeo previo, solo confirmación del lado de la UI.
  const { error } = await supabase
    .from("lineas_presupuesto")
    .delete()
    .eq("id", id);

  if (error) {
    return { ok: false, mensaje: error.message };
  }

  revalidatePath("/panel/finanzas/presupuesto");
  return { ok: true };
}
