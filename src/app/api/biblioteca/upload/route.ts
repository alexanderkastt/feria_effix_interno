import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { driveConfigurado, subirArchivoADrive } from "@/lib/googleDrive";

// POST /api/biblioteca/upload — sube un archivo a Google Drive y registra en la base.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, mensaje: "No autenticado." },
      { status: 401 },
    );
  }

  if (!driveConfigurado()) {
    return NextResponse.json(
      {
        ok: false,
        mensaje:
          "Google Drive no está configurado. Falta la Service Account (GOOGLE_SERVICE_ACCOUNT_JSON y DRIVE_FOLDER_ID).",
      },
      { status: 501 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const tipo = String(form.get("tipo") ?? "otro");
  const areaSlug = String(form.get("area_slug") ?? "");
  const tagsRaw = String(form.get("tags") ?? "");

  // Resolver el slug del área a su uuid (area_relacionada es FK a areas.id).
  let areaId: string | null = null;
  if (areaSlug) {
    const { data: areaRow } = await supabase
      .from("areas")
      .select("id")
      .eq("nombre", areaSlug)
      .single();
    areaId = areaRow?.id ?? null;
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, mensaje: "Falta el archivo." },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const d = await subirArchivoADrive({
      nombre: file.name,
      mimeType: file.type || "application/octet-stream",
      buffer,
    });

    const { error } = await supabase.from("biblioteca_archivos").insert({
      nombre: file.name,
      tipo,
      area_relacionada: areaId,
      drive_file_id: d.id,
      drive_url: d.webViewLink,
      miniatura_url: d.thumbnailLink,
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      subido_por: user.id,
      tamano_bytes: d.size ? Number(d.size) : null,
      mime_type: d.mimeType ?? file.type,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, mensaje: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        mensaje: e instanceof Error ? e.message : "Error al subir.",
      },
      { status: 500 },
    );
  }
}
