import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MiPerfil, type MiPerfilData } from "@/components/panel/MiPerfil";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios")
    .select(
      "id, email, nombre, rol_base, telefono, cargo, avatar_url, notif_por_email",
    )
    .eq("id", sesion.perfil.id)
    .single();

  if (!data) notFound();

  return <MiPerfil perfil={data as MiPerfilData} />;
}
