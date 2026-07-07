import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const fmt = (n: number) => new Intl.NumberFormat("es-CO").format(n);

export async function GET() {
  const sesion = await getSesion();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const supabase = await createClient();
  const [okrsRes, kpisRes, valoresRes] = await Promise.all([
    supabase
      .from("okrs")
      .select("titulo_objetivo, resultados_clave(progreso_calculado)")
      .is("area_id", null),
    supabase.from("kpis").select("id, nombre, unidad, meta").eq("activo", true),
    supabase
      .from("kpi_valores")
      .select("kpi_id, valor, fecha_medicion")
      .order("fecha_medicion", { ascending: false }),
  ]);

  const ultimo = new Map<string, number>();
  for (const v of valoresRes.data ?? []) {
    if (!ultimo.has(v.kpi_id)) ultimo.set(v.kpi_id, Number(v.valor));
  }

  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const azul = rgb(0.102, 0.435, 1);
  let y = 790;
  const linea = (
    t: string,
    x: number,
    size: number,
    f = font,
    color = rgb(0, 0, 0),
  ) => {
    if (y < 50) {
      page = pdf.addPage([595, 842]);
      y = 790;
    }
    page.drawText(t, { x, y, size, font: f, color });
    y -= size + 10;
  };

  linea("Feria Effix 2026 · Medición", 50, 12, bold, azul);
  y -= 8;
  linea("OKRs transversales", 50, 16, bold);
  for (const o of okrsRes.data ?? []) {
    const rcs =
      (o.resultados_clave as unknown as { progreso_calculado: number }[]) ?? [];
    const prog =
      rcs.length > 0
        ? rcs.reduce((s, r) => s + Number(r.progreso_calculado), 0) / rcs.length
        : 0;
    linea(
      `${o.titulo_objetivo}  —  ${prog.toFixed(0)}%`,
      50,
      11,
      font,
      rgb(0.3, 0.3, 0.3),
    );
  }

  y -= 10;
  linea("KPIs", 50, 16, bold);
  for (const k of kpisRes.data ?? []) {
    const v = ultimo.get(k.id);
    const valTxt =
      v === undefined
        ? "—"
        : k.unidad === "porcentaje"
          ? `${v.toFixed(1)}%`
          : fmt(v);
    const metaTxt =
      k.meta === null
        ? "—"
        : k.unidad === "porcentaje"
          ? `${Number(k.meta)}%`
          : fmt(Number(k.meta));
    linea(
      `${k.nombre}: ${valTxt}  (meta ${metaTxt})`,
      50,
      11,
      font,
      rgb(0.3, 0.3, 0.3),
    );
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="medicion-feria-effix.pdf"`,
    },
  });
}
