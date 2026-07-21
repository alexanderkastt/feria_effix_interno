import { createClient } from "@/lib/supabase/server";
import { AREAS, type AreaMeta, type AreaSlug } from "@/lib/areas";

export type RolBase =
  | "directivo"
  | "administrativo"
  | "gestor_area"
  | "colaborador"
  | "finanzas_operativo";

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
  /**
   * Único usuario con acceso total a la plataforma, incluidos los módulos
   * que todavía no están listos para el resto del equipo (`listo: false`
   * en `@/lib/areas`). Se identifica por email, no por `rol_base`: "root"
   * es sobre el desarrollador de la plataforma, no sobre un rol de negocio
   * como 'directivo'. Los demás usuarios (sean o no directivo/administrativo)
   * solo ven los módulos ya marcados `listo: true`.
   */
  esRoot: boolean;
  /**
   * rol_base === 'finanzas_operativo'. Rol de sensibilidad media dentro del
   * módulo de Finanzas: ve nivel "detalle" (líneas de ingreso/egreso con
   * proveedor/cliente, monto, factura) pero NO nivel "personal" (NITs,
   * nómina individual, datos bancarios) salvo excepción explícita otorgada
   * por directivo/administrativo (ver `finanzas_excepciones_acceso` y
   * `puede_ver_nivel_financiero()` en la base de datos). No confundir con
   * `esAdmin`: un finanzas_operativo NO es directivo/administrativo.
   */
  esFinanzasOperativo: boolean;
  areas: AreaAccesible[];
}

const EMAIL_ROOT = "jacsolucionesgraficas@gmail.com";

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

  const esRoot = perfil.email === EMAIL_ROOT;
  const esAdmin =
    perfil.rol_base === "directivo" || perfil.rol_base === "administrativo";
  const esFinanzasOperativo = perfil.rol_base === "finanzas_operativo";

  let areas: AreaAccesible[];
  if (esRoot) {
    // Ve todos los módulos, estén "listos" o no — necesita poder probarlos.
    areas = AREAS.map((a) => ({ ...a, nivel: "admin" as const }));
  } else if (esAdmin) {
    areas = AREAS.filter((a) => a.listo).map((a) => ({
      ...a,
      nivel: "admin" as const,
    }));
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
    areas = AREAS.filter((a) => a.listo && porSlug.has(a.slug)).map((a) => ({
      ...a,
      nivel: porSlug.get(a.slug)!,
    }));
  }

  return { perfil, esAdmin, esRoot, esFinanzasOperativo, areas };
}
