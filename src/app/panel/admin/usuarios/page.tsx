import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  UsuariosAdmin,
  type UsuarioView,
  type AreaOption,
} from "@/components/panel/UsuariosAdmin";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  // Gate de seguridad: solo directivo/administrativo, ni por URL directa.
  const sesion = await getSesion();
  if (!sesion || !sesion.esAdmin) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios")
    .select(
      "id, email, nombre, rol_base, usuario_areas(nivel_acceso, area:areas(id, nombre))",
    )
    .order("creado_en");

  const usuarios: UsuarioView[] = (data ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    nombre: u.nombre,
    rol_base: u.rol_base,
    areas: (
      (u.usuario_areas as unknown as {
        nivel_acceso: string;
        area: { id: string; nombre: AreaSlug } | null;
      }[]) ?? []
    )
      .filter((ua) => ua.area)
      .map((ua) => ({
        areaId: ua.area!.id,
        slug: ua.area!.nombre,
        label: AREA_LABEL[ua.area!.nombre],
        nivel: ua.nivel_acceso as AreaOption["nivel"],
      })),
  }));

  const { data: areasData } = await supabase
    .from("areas")
    .select("id, nombre")
    .order("nombre");
  const areaOptions: AreaOption[] = (areasData ?? []).map((a) => ({
    id: a.id,
    slug: a.nombre as AreaSlug,
    label: AREA_LABEL[a.nombre as AreaSlug],
    nivel: "lectura",
  }));

  return <UsuariosAdmin usuarios={usuarios} areaOptions={areaOptions} />;
}
