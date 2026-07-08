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

  // logo e imagen son el mismo archivo de cara al cliente: cargar el logo
  // también cierra el check "imagen_enviada" del checklist.
  const { error: errorUpdate } = await admin
    .from("stands")
    .update({ logo_url: logoUrl, logo_recibido: true, imagen_enviada: true })
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

export interface FormularioDirectorioInput {
  nombre: string;
  ciudad: string;
  pais: string;
  direccion: string;
  telefono: string;
  email: string;
  sitioWeb: string;
  descripcion: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  linkedin: string;
}

// Guarda los datos de contacto para el futuro Directorio de Marcas. Requiere
// nombre, ciudad, país, teléfono y correo (lo mínimo para que un posible
// cliente pueda contactar a la marca); el resto es opcional. Al completarse
// esos campos marca formulario_directorio_lleno = true automáticamente.
export async function guardarFormularioDirectorio(
  token: string,
  input: FormularioDirectorioInput,
): Promise<AccionResult> {
  const nombre = input.nombre.trim();
  const ciudad = input.ciudad.trim();
  const pais = input.pais.trim();
  const telefono = input.telefono.trim();
  const email = input.email.trim();

  if (!nombre || !ciudad || !pais || !telefono || !email) {
    return {
      ok: false,
      mensaje:
        "Completá al menos nombre, ciudad, país, teléfono y correo para terminar el formulario.",
    };
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

  const { error } = await admin
    .from("stands")
    .update({
      nombre,
      ciudad,
      directorio_pais: pais,
      directorio_direccion: input.direccion.trim() || null,
      directorio_telefono: telefono,
      directorio_email: email,
      directorio_sitio_web: input.sitioWeb.trim() || null,
      directorio_descripcion: input.descripcion.trim() || null,
      directorio_instagram: input.instagram.trim() || null,
      directorio_facebook: input.facebook.trim() || null,
      directorio_tiktok: input.tiktok.trim() || null,
      directorio_linkedin: input.linkedin.trim() || null,
      formulario_directorio_lleno: true,
    })
    .eq("id", stand.id);
  if (error) return { ok: false, mensaje: error.message };

  revalidatePath(`/mi-stand/${token}`);
  revalidatePath("/panel/stands");
  return { ok: true };
}
