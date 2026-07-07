"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface Notif {
  id: string;
  tipo:
    | "tarea_asignada"
    | "tarea_vencida"
    | "aprobacion_pendiente"
    | "pago_recibido"
    | "postulacion_nueva"
    | "mencion";
  titulo: string;
  mensaje: string | null;
  url_relacionada: string | null;
  leida: boolean;
  creado_en: string;
}

// RLS ya limita a las notificaciones del usuario actual (usuario_id = auth.uid()).
export async function getNotificaciones(
  limit = 8,
): Promise<{ items: Notif[]; noLeidas: number }> {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notificaciones_internas")
      .select("id, tipo, titulo, mensaje, url_relacionada, leida, creado_en")
      .order("creado_en", { ascending: false })
      .limit(limit),
    supabase
      .from("notificaciones_internas")
      .select("*", { count: "exact", head: true })
      .eq("leida", false),
  ]);
  return { items: (data ?? []) as Notif[], noLeidas: count ?? 0 };
}

export async function getTodas(
  soloNoLeidas = false,
): Promise<{ items: Notif[]; notifPorEmail: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let q = supabase
    .from("notificaciones_internas")
    .select("id, tipo, titulo, mensaje, url_relacionada, leida, creado_en")
    .order("creado_en", { ascending: false })
    .limit(200);
  if (soloNoLeidas) q = q.eq("leida", false);

  const [{ data }, perfil] = await Promise.all([
    q,
    supabase
      .from("usuarios")
      .select("notif_por_email")
      .eq("id", user?.id ?? "")
      .single(),
  ]);
  return {
    items: (data ?? []) as Notif[],
    notifPorEmail: !!perfil.data?.notif_por_email,
  };
}

export async function marcarLeida(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificaciones_internas")
    .update({ leida: true })
    .eq("id", id);
  revalidatePath("/panel/notificaciones");
  return { ok: !error };
}

export async function marcarTodasLeidas(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notificaciones_internas")
    .update({ leida: true })
    .eq("leida", false);
  revalidatePath("/panel/notificaciones");
  return { ok: !error };
}

export async function setNotifPorEmail(
  valor: boolean,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase
    .from("usuarios")
    .update({ notif_por_email: valor })
    .eq("id", user.id);
  revalidatePath("/panel/notificaciones");
  return { ok: !error };
}
