import { createClient } from "@/lib/supabase/server";
import { AREAS, type AreaMeta, type AreaSlug } from "@/lib/areas";

export type RolBase =
  | "directivo"
  | "administrativo"
  | "gestor_area"
  | "colaborador";

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  rol_base: RolBase;
}

export interface AreaAccesible extends AreaMeta {
  nivel: "lectura" | "edicion" | "admin";
}

export interface Sesion {
  perfil: Perfil;
  esAdmin: boolean;
  areas: AreaAccesible[];
}

// Devuelve el perfil del usuario logueado y las áreas a las que tiene acceso.
// Retorna null si no hay sesión. Respeta RLS (usa el cliente con la sesión).
export async function getSesion(): Promise<Sesion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, email, nombre, rol_base")
    .eq("id", user.id)
    .single();

  if (!perfil) return null;

  const esAdmin =
    perfil.rol_base === "directivo" || perfil.rol_base === "administrativo";

  let areas: AreaAccesible[];
  if (esAdmin) {
    areas = AREAS.map((a) => ({ ...a, nivel: "admin" as const }));
  } else {
    const { data: filas } = await supabase
      .from("usuario_areas")
      .select("nivel_acceso, areas(nombre)");
    const porSlug = new Map<AreaSlug, AreaAccesible["nivel"]>();
    for (const f of filas ?? []) {
      const nombre = (f.areas as unknown as { nombre: AreaSlug } | null)
        ?.nombre;
      if (nombre) porSlug.set(nombre, f.nivel_acceso as AreaAccesible["nivel"]);
    }
    areas = AREAS.filter((a) => porSlug.has(a.slug)).map((a) => ({
      ...a,
      nivel: porSlug.get(a.slug)!,
    }));
  }

  return { perfil, esAdmin, areas };
}
