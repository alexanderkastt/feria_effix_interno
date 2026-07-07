"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

const TIPOS_PERMITIDOS = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];
const MAX_BYTES = 5 * 1024 * 1024;

// Server action del link público del cliente (/mi-stand/[token]). Nunca pasa
// por RLS de anon: valida el token acá mismo y escribe con service_role,
// mismo patrón que reservarStand/confirmarReserva en /mapa-stands/actions.ts.
export async function subirLogoStandPublico(
  token: string,
  formData: FormData,
): Promise<AccionResult> {
  const archivo = formData.get("logo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, mensaje: "Elegí un archivo de logo." };
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return {
      ok: false,
      mensaje: "Formato no soportado. Usá PNG, JPG, WEBP o SVG.",
    };
  }
  if (archivo.size > MAX_BYTES) {
    return { ok: false, mensaje: "El archivo no puede pesar más de 5 MB." };
  }

  const admin = createAdminClient();
  const { data: stand, error: errorStand } = await admin
    .from("stands")
    .select("id")
    .eq("token_publico", token)
    .single();
  if (errorStand || !stand) {
    return { ok: false, mensaje: "Link inválido." };
  }

  const ext = archivo.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${stand.id}.${ext}`;
  const buffer = Buffer.from(await archivo.arrayBuffer());

  const { error: errorUpload } = await admin.storage
    .from("stands-logos")
    .upload(path, buffer, { contentType: archivo.type, upsert: true });
  if (errorUpload) {
    return { ok: false, mensaje: "No se pudo subir el logo. Probá de nuevo." };
  }

  const { data: pub } = admin.storage.from("stands-logos").getPublicUrl(path);
  // Cache-busting simple: sin esto el navegador podría seguir mostrando el
  // logo viejo (misma URL) si el cliente reemplaza el archivo más tarde.
  const logoUrl = `${pub.publicUrl}?actualizado=${encodeURIComponent(new Date().toISOString())}`;

  const { error: errorUpdate } = await admin
    .from("stands")
    .update({ logo_url: logoUrl, logo_recibido: true })
    .eq("id", stand.id);
  if (errorUpdate) {
    return {
      ok: false,
      mensaje: "El logo se subió pero no se pudo guardar. Avisá al equipo.",
    };
  }

  revalidatePath(`/mi-stand/${token}`);
  revalidatePath("/panel/stands");
  return { ok: true };
}
