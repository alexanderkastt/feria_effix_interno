import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { driveConfigurado } from "@/lib/googleDrive";
import {
  BibliotecaGrid,
  type ArchivoView,
} from "@/components/panel/BibliotecaGrid";
import type { AreaSlug } from "@/lib/areas";

export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("biblioteca_archivos")
    .select(
      "id, nombre, tipo, drive_url, miniatura_url, tags, mime_type, area:areas(nombre)",
    )
    .order("subido_en", { ascending: false });

  const archivos: ArchivoView[] = (data ?? []).map((a) => ({
    id: a.id,
    nombre: a.nombre,
    tipo: a.tipo,
    drive_url: a.drive_url,
    miniatura_url: a.miniatura_url,
    tags: a.tags ?? [],
    mime_type: a.mime_type,
    area: (a.area as unknown as { nombre: AreaSlug } | null)?.nombre ?? null,
  }));

  return <BibliotecaGrid archivos={archivos} driveOk={driveConfigurado()} />;
}
