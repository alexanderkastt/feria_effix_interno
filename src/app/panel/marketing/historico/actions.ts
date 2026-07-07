"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Fila ya normalizada por el cliente (mapeo de headers → nuestras columnas).
export interface FilaHistorico {
  campana?: string | null;
  edad?: string | null;
  sexo?: string | null;
  anuncios?: string | number | null;
  objetivo?: string | null;
  alcance?: string | number | null;
  gasto_cop?: string | number | null;
  resultados?: string | number | null;
  costo_por_resultado?: string | number | null;
  ctr?: string | number | null;
  cvr?: string | number | null;
  fecha?: string | null;
}

export interface ImportResult {
  ok: boolean;
  importadas: number;
  saltadas: number;
  mensaje?: string;
}

// Convierte texto de Meta Ads (con separadores de miles, %, comas decimales,
// celdas vacías o "—") a número o null sin romper.
function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (s === "" || s === "-" || s === "—" || /^n\/?a$/i.test(s)) return null;
  s = s.replace(/%/g, "").replace(/\$/g, "").replace(/\s/g, "");
  // Si tiene coma y no punto, la coma es decimal; si tiene ambos, la coma es miles.
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function ent(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.round(n);
}

function txt(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function fecha(v: unknown): string | null {
  const s = txt(v);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export async function importarHistorico(
  filas: FilaHistorico[],
): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const registros = [];
  let saltadas = 0;
  for (const f of filas) {
    const campana = txt(f.campana);
    const objetivo = txt(f.objetivo);
    const gasto = num(f.gasto_cop);
    const resultados = ent(f.resultados);
    const alcance = ent(f.alcance);
    // Fila totalmente vacía → se salta (no rompe la importación).
    if (
      !campana &&
      !objetivo &&
      gasto === null &&
      resultados === null &&
      alcance === null
    ) {
      saltadas += 1;
      continue;
    }
    registros.push({
      campana,
      edad: txt(f.edad),
      sexo: txt(f.sexo),
      anuncios: ent(f.anuncios),
      objetivo,
      alcance,
      gasto_cop: gasto,
      resultados,
      costo_por_resultado: num(f.costo_por_resultado),
      ctr: num(f.ctr),
      cvr: num(f.cvr),
      fecha: fecha(f.fecha),
      importado_por: user?.id ?? null,
    });
  }

  if (registros.length === 0) {
    return {
      ok: false,
      importadas: 0,
      saltadas,
      mensaje: "No había filas válidas en el archivo.",
    };
  }

  // Inserción por lotes para archivos grandes.
  let importadas = 0;
  for (let i = 0; i < registros.length; i += 500) {
    const lote = registros.slice(i, i + 500);
    const { error } = await supabase
      .from("datos_historicos_marketing")
      .insert(lote);
    if (error) {
      return {
        ok: false,
        importadas,
        saltadas,
        mensaje: `Se importaron ${importadas} antes de un error: ${error.message}`,
      };
    }
    importadas += lote.length;
  }

  revalidatePath("/panel/marketing/historico");
  return { ok: true, importadas, saltadas };
}
