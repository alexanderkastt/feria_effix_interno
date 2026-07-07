import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";

export const dynamic = "force-dynamic";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// Devuelve pares [etiqueta, valor] según el reporte pedido.
async function construirFilas(
  reporte: string,
  areaSlug: string | null,
): Promise<{ titulo: string; filas: [string, string][] } | null> {
  const sesion = await getSesion();
  if (!sesion) return null;
  const supabase = await createClient();

  if (reporte === "general") {
    if (!sesion.esAdmin) return null; // solo admin
    const [
      { data: stands },
      { data: patros },
      { data: ingresos },
      { data: gastos },
      { data: ponentes },
    ] = await Promise.all([
      supabase.from("stands").select("estado"),
      supabase.from("patrocinios").select("monto, estado_pago"),
      supabase.from("ingresos").select("monto, estado"),
      supabase.from("gastos").select("monto, estado"),
      supabase.from("postulaciones_ponentes").select("estado"),
    ]);
    const total = stands?.length ?? 0;
    const vendidos = (stands ?? []).filter(
      (s) => s.estado === "vendido",
    ).length;
    const patTotal = (patros ?? []).reduce((s, p) => s + Number(p.monto), 0);
    const patPago = (patros ?? [])
      .filter((p) => p.estado_pago === "pagado")
      .reduce((s, p) => s + Number(p.monto), 0);
    const ing = (ingresos ?? [])
      .filter((i) => i.estado === "confirmado" || i.estado === "cobrado")
      .reduce((s, i) => s + Number(i.monto), 0);
    const gas = (gastos ?? [])
      .filter((g) => g.estado === "pagado")
      .reduce((s, g) => s + Number(g.monto), 0);
    return {
      titulo: "Estado general de la feria",
      filas: [
        ["Stands vendidos", `${vendidos}/${total}`],
        ["Patrocinios facturados", fmtCOP(patPago)],
        ["Patrocinios comprometidos", fmtCOP(patTotal)],
        [
          "Ponentes aceptados",
          String(
            (ponentes ?? []).filter((p) => p.estado === "aceptado").length,
          ),
        ],
        ["Ingresos (confirmado+cobrado)", fmtCOP(ing)],
        ["Gastos pagados", fmtCOP(gas)],
        ["Balance", fmtCOP(ing - gas)],
      ],
    };
  }

  // reporte por área
  const slug = (areaSlug ?? "") as AreaSlug;
  const puede = sesion.esAdmin || sesion.areas.some((a) => a.slug === slug);
  if (!puede || !AREA_LABEL[slug]) return null;

  const { data: areaRow } = await supabase
    .from("areas")
    .select("id")
    .eq("nombre", slug)
    .single();
  const { data: tareas } = await supabase
    .from("tareas")
    .select("estado")
    .eq("area_id", areaRow?.id ?? "");

  const conteo = { pendiente: 0, en_proceso: 0, bloqueado: 0, hecho: 0 };
  for (const t of tareas ?? []) conteo[t.estado as keyof typeof conteo] += 1;
  return {
    titulo: `Reporte de área: ${AREA_LABEL[slug]}`,
    filas: [
      ["Completadas", String(conteo.hecho)],
      ["En proceso", String(conteo.en_proceso)],
      ["Pendientes", String(conteo.pendiente)],
      ["Bloqueadas", String(conteo.bloqueado)],
    ],
  };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const formato = sp.get("formato") ?? "csv";
  const reporte = sp.get("reporte") ?? "general";
  const area = sp.get("area");

  const data = await construirFilas(reporte, area);
  if (!data) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (formato === "csv") {
    const csv =
      `Reporte,${JSON.stringify(data.titulo)}\n\nMétrica,Valor\n` +
      data.filas
        .map(([k, v]) => `${JSON.stringify(k)},${JSON.stringify(v)}`)
        .join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-${reporte}.csv"`,
      },
    });
  }

  // PDF con pdf-lib
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const azul = rgb(0.102, 0.435, 1);
  let y = 780;
  page.drawText("Feria Effix 2026", {
    x: 50,
    y,
    size: 12,
    font: bold,
    color: azul,
  });
  y -= 30;
  page.drawText(data.titulo, { x: 50, y, size: 18, font: bold });
  y -= 36;
  for (const [k, v] of data.filas) {
    page.drawText(k, { x: 50, y, size: 12, font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(v, { x: 320, y, size: 12, font: bold });
    y -= 24;
  }
  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="reporte-${reporte}.pdf"`,
    },
  });
}
