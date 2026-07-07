"use server";

import { createClient } from "@/lib/supabase/server";

export interface PostulacionState {
  ok: boolean;
  mensaje: string;
}

const SUPABASE_LISTO =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("TODO");

const FORMATOS = [
  "ponencia_general",
  "conversatorio",
  "workshop",
  "pregunta_en_vivo",
  "live_selling",
];

function limpiar(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function postularPonente(
  _prev: PostulacionState,
  formData: FormData,
): Promise<PostulacionState> {
  // Validación del lado del servidor (nunca confiar solo en el cliente).
  const nombre = limpiar(formData.get("nombre"));
  const tema = limpiar(formData.get("tema_propuesto"));
  const formato = limpiar(formData.get("formato_participacion"));

  if (nombre.length < 3) {
    return { ok: false, mensaje: "Ingresá tu nombre completo." };
  }
  if (tema.length < 5) {
    return { ok: false, mensaje: "Contanos el tema propuesto." };
  }
  if (!FORMATOS.includes(formato)) {
    return { ok: false, mensaje: "Elegí un formato de participación válido." };
  }

  const registro = {
    nombre,
    tema_propuesto: tema,
    formato_participacion: formato,
    experiencia_previa: limpiar(formData.get("experiencia_previa")),
    video_url: limpiar(formData.get("video_url")) || null,
    ig: limpiar(formData.get("ig")) || null,
    tiktok: limpiar(formData.get("tiktok")) || null,
    linkedin: limpiar(formData.get("linkedin")) || null,
    facebook: limpiar(formData.get("facebook")) || null,
    youtube: limpiar(formData.get("youtube")) || null,
    estado: "pendiente_revision",
  };

  if (!SUPABASE_LISTO) {
    return {
      ok: true,
      mensaje:
        "Postulación recibida (modo demo). Se guardará en la base al conectar Supabase.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("postulaciones_ponentes")
    .insert(registro);

  if (error) {
    return {
      ok: false,
      mensaje: "No pudimos registrar tu postulación. Intentá de nuevo.",
    };
  }

  return {
    ok: true,
    mensaje: "¡Listo! Recibimos tu postulación. El equipo la revisará pronto.",
  };
}
