"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSesion } from "@/lib/auth";

type RolBase = "directivo" | "administrativo" | "gestor_area" | "colaborador";
type Nivel = "lectura" | "edicion" | "admin";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Gate: toda acción exige directivo/administrativo.
async function exigirAdmin(): Promise<AccionResult | null> {
  const sesion = await getSesion();
  if (!sesion?.esAdmin) return { ok: false, mensaje: "No autorizado." };
  return null;
}

export async function crearUsuario(input: {
  email: string;
  nombre: string;
  password: string;
  rol_base: RolBase;
}): Promise<AccionResult> {
  const no = await exigirAdmin();
  if (no) return no;

  const email = input.email.trim().toLowerCase();
  const nombre = input.nombre.trim();
  if (!email.includes("@") || nombre.length < 2 || input.password.length < 6) {
    return {
      ok: false,
      mensaje: "Datos inválidos (revisá correo/nombre/clave).",
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { nombre },
  });
  if (error || !data.user) {
    return {
      ok: false,
      mensaje: error?.message ?? "No se pudo crear el usuario.",
    };
  }

  // El trigger creó la fila en `usuarios`; fijamos su rol.
  const { error: e2 } = await admin
    .from("usuarios")
    .update({ rol_base: input.rol_base, nombre })
    .eq("id", data.user.id);
  if (e2) return { ok: false, mensaje: e2.message };

  revalidatePath("/panel/admin/usuarios");
  return { ok: true };
}

export async function cambiarRol(
  usuarioId: string,
  rol_base: RolBase,
): Promise<AccionResult> {
  const no = await exigirAdmin();
  if (no) return no;
  const supabase = await createClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ rol_base })
    .eq("id", usuarioId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/admin/usuarios");
  return { ok: true };
}

export async function asignarArea(
  usuarioId: string,
  areaId: string,
  nivel: Nivel,
): Promise<AccionResult> {
  const no = await exigirAdmin();
  if (no) return no;
  const supabase = await createClient();
  const { error } = await supabase
    .from("usuario_areas")
    .upsert(
      { usuario_id: usuarioId, area_id: areaId, nivel_acceso: nivel },
      { onConflict: "usuario_id,area_id" },
    );
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/admin/usuarios");
  return { ok: true };
}

export async function quitarArea(
  usuarioId: string,
  areaId: string,
): Promise<AccionResult> {
  const no = await exigirAdmin();
  if (no) return no;
  const supabase = await createClient();
  const { error } = await supabase
    .from("usuario_areas")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("area_id", areaId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/admin/usuarios");
  return { ok: true };
}
