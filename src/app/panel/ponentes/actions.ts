"use server";

import { revalidatePath } from "next/cache";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoPonente =
  | "prospecto"
  | "contactado"
  | "pendiente_revision"
  | "mas_info"
  | "aceptado"
  | "confirmado"
  | "agendado"
  | "rechazado";

export interface PonenteDatos {
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  cargo?: string | null;
  empresa?: string | null;
  ciudad_pais?: string | null;
  foto_url?: string | null;
  tema_propuesto: string;
  formato_participacion: string;
  experiencia_previa?: string | null;
  bio?: string | null;
  video_url?: string | null;
  ig?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  notas_internas?: string | null;
  estado?: EstadoPonente;
}

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

async function puedeGestionar(): Promise<boolean> {
  const sesion = await getSesion();
  if (!sesion) return false;
  if (sesion.esRoot) return true;
  const a = sesion.areas.find((x) => x.slug === "ponentes");
  return !!a && a.nivel !== "lectura";
}

function limpiar(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}

function normalizar(d: PonenteDatos) {
  return {
    nombre: d.nombre.trim(),
    email: limpiar(d.email),
    telefono: limpiar(d.telefono),
    cargo: limpiar(d.cargo),
    empresa: limpiar(d.empresa),
    ciudad_pais: limpiar(d.ciudad_pais),
    foto_url: limpiar(d.foto_url),
    tema_propuesto: d.tema_propuesto.trim(),
    formato_participacion: d.formato_participacion,
    experiencia_previa: limpiar(d.experiencia_previa),
    bio: limpiar(d.bio),
    video_url: limpiar(d.video_url),
    ig: limpiar(d.ig),
    tiktok: limpiar(d.tiktok),
    linkedin: limpiar(d.linkedin),
    facebook: limpiar(d.facebook),
    youtube: limpiar(d.youtube),
    notas_internas: limpiar(d.notas_internas),
  };
}

// Alta MANUAL de un ponente (prospecto por defecto).
export async function crearPonenteManual(
  d: PonenteDatos,
): Promise<AccionResult> {
  if (!(await puedeGestionar())) return { ok: false, mensaje: "Sin permiso." };
  if (d.nombre.trim().length < 2)
    return { ok: false, mensaje: "Falta el nombre." };
  if (d.tema_propuesto.trim().length < 2)
    return { ok: false, mensaje: "Falta el tema propuesto." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("postulaciones_ponentes").insert({
    ...normalizar(d),
    estado: d.estado ?? "prospecto",
    origen: "manual",
    responsable_id: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/ponentes");
  return { ok: true };
}

// Editar todos los campos de un ponente.
export async function editarPonente(
  id: string,
  d: PonenteDatos,
): Promise<AccionResult> {
  if (!(await puedeGestionar())) return { ok: false, mensaje: "Sin permiso." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("postulaciones_ponentes")
    .update(normalizar(d))
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/ponentes");
  return { ok: true };
}

// Mover de etapa. Si pasa a 'aceptado' (desde otra etapa) crea tareas en
// Diseño (escarapela) y Logística (dossier), sin duplicar.
export async function moverEtapaPonente(
  id: string,
  estado: EstadoPonente,
): Promise<AccionResult> {
  if (!(await puedeGestionar())) return { ok: false, mensaje: "Sin permiso." };
  const supabase = await createClient();
  const { data: prev } = await supabase
    .from("postulaciones_ponentes")
    .select("nombre, estado")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("postulaciones_ponentes")
    .update({ estado })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };

  if (estado === "aceptado" && prev && prev.estado !== "aceptado") {
    await crearTareasAceptacion(prev.nombre as string);
  }
  revalidatePath("/panel/ponentes");
  return { ok: true };
}

async function crearTareasAceptacion(nombre: string) {
  const admin = createAdminClient();
  const tituloEscarapela = `Escarapela de ponente: ${nombre}`;
  // Evitar duplicar si ya se creó antes.
  const { data: existente } = await admin
    .from("tareas")
    .select("id")
    .eq("titulo", tituloEscarapela)
    .limit(1);
  if (existente && existente.length) return;

  const { data: areas } = await admin
    .from("areas")
    .select("id, nombre")
    .in("nombre", ["diseno", "logistica"]);
  const idPorNombre = new Map(
    (areas ?? []).map((a) => [a.nombre as string, a.id as string]),
  );
  const tareas: {
    area_id: string;
    titulo: string;
    estado: string;
    prioridad: string;
  }[] = [];
  const diseno = idPorNombre.get("diseno");
  const logistica = idPorNombre.get("logistica");
  if (diseno)
    tareas.push({
      area_id: diseno,
      titulo: tituloEscarapela,
      estado: "pendiente",
      prioridad: "alta",
    });
  if (logistica)
    tareas.push({
      area_id: logistica,
      titulo: `Dossier técnico (audio/pantalla/PPT): ${nombre}`,
      estado: "pendiente",
      prioridad: "alta",
    });
  if (tareas.length) await admin.from("tareas").insert(tareas);
}
