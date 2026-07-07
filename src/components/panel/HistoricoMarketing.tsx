"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Papa from "papaparse";
import {
  importarHistorico,
  type FilaHistorico,
  type ImportResult,
} from "@/app/panel/marketing/historico/actions";

export interface RegistroHistorico {
  id: string;
  campana: string | null;
  objetivo: string | null;
  alcance: number | null;
  gasto_cop: number | null;
  resultados: number | null;
  costo_por_resultado: number | null;
  ctr: number | null;
  cvr: number | null;
  fecha: string | null;
}

const fmtNum = (n: number | null) =>
  n === null ? "—" : new Intl.NumberFormat("es-CO").format(n);
const fmtCOP = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

// Mapea headers arbitrarios del CSV de Meta Ads a nuestras columnas.
const MATCHERS: Record<keyof FilaHistorico, string[]> = {
  campana: ["campañ", "campan", "campaign", "nombre"],
  edad: ["edad", "age"],
  sexo: ["sexo", "gener", "sex"],
  anuncios: ["anuncio", "ads"],
  objetivo: ["objetivo", "objective"],
  alcance: ["alcance", "reach"],
  gasto_cop: ["gasto", "importe", "spend", "amount", "inversión", "inversion"],
  resultados: ["resultado", "result"],
  costo_por_resultado: ["costo por", "cost per", "cpr", "costo/"],
  ctr: ["ctr"],
  cvr: ["cvr", "conversion rate", "tasa de conversión"],
  fecha: ["fecha", "date", "día", "dia", "inicio"],
};

function normalizar(raw: Record<string, unknown>): FilaHistorico {
  const headers = Object.keys(raw);
  const out: FilaHistorico = {};
  (Object.keys(MATCHERS) as (keyof FilaHistorico)[]).forEach((key) => {
    const h = headers.find((hd) =>
      MATCHERS[key].some((m) => hd.toLowerCase().includes(m)),
    );
    if (h) out[key] = raw[h] as string;
  });
  return out;
}

export function HistoricoMarketing({ filas }: { filas: RegistroHistorico[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [resultado, setResultado] = useState<ImportResult | null>(null);

  const [fCampana, setFCampana] = useState("");
  const [fObjetivo, setFObjetivo] = useState("");
  const [fDesde, setFDesde] = useState("");
  const [fHasta, setFHasta] = useState("");

  const objetivos = useMemo(
    () =>
      [...new Set(filas.map((f) => f.objetivo).filter(Boolean))] as string[],
    [filas],
  );

  const filtradas = useMemo(
    () =>
      filas.filter((f) => {
        if (
          fCampana &&
          !(f.campana ?? "").toLowerCase().includes(fCampana.toLowerCase())
        )
          return false;
        if (fObjetivo && f.objetivo !== fObjetivo) return false;
        if (fDesde && (!f.fecha || f.fecha < fDesde)) return false;
        if (fHasta && (!f.fecha || f.fecha > fHasta)) return false;
        return true;
      }),
    [filas, fCampana, fObjetivo, fDesde, fHasta],
  );

  // Agregado por campaña para el gráfico (gasto vs resultados).
  const porCampana = useMemo(() => {
    const m = new Map<string, { gasto: number; resultados: number }>();
    for (const f of filtradas) {
      const k = f.campana ?? "(sin nombre)";
      const a = m.get(k) ?? { gasto: 0, resultados: 0 };
      a.gasto += f.gasto_cop ?? 0;
      a.resultados += f.resultados ?? 0;
      m.set(k, a);
    }
    return [...m.entries()]
      .map(([campana, v]) => ({ campana, ...v }))
      .sort((a, b) => b.gasto - a.gasto)
      .slice(0, 10);
  }, [filtradas]);

  const maxGasto = Math.max(1, ...porCampana.map((c) => c.gasto));
  const maxRes = Math.max(1, ...porCampana.map((c) => c.resultados));

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResultado(null);
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const filasNorm = res.data.map(normalizar);
        startTransition(async () => {
          const r = await importarHistorico(filasNorm);
          setResultado(r);
          if (inputRef.current) inputRef.current.value = "";
        });
      },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Histórico de marketing
        </h1>
        <p className="text-sm text-muted">
          Campañas históricas de Meta Ads importadas a la plataforma.
        </p>
      </div>

      {/* Importar CSV */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Importar CSV de Meta Ads</h2>
            <p className="text-xs text-muted">
              Se aceptan archivos con columnas incompletas: las celdas vacías o
              mal formateadas se importan como vacías, no rompen la carga.
            </p>
          </div>
          <label className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong">
            {pending ? "Importando…" : "Subir CSV"}
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={pending}
              onChange={onFile}
            />
          </label>
        </div>
        {resultado && (
          <p
            className={`mt-3 rounded-md border px-3 py-2 text-sm ${
              resultado.ok
                ? "border-ok/40 bg-ok/10 text-ok"
                : "border-warn/40 bg-warn/10 text-warn"
            }`}
          >
            {resultado.ok
              ? `Importadas ${resultado.importadas} filas · ${resultado.saltadas} saltadas (vacías).`
              : resultado.mensaje}
          </p>
        )}
      </section>

      {/* Gráfico gasto vs resultados */}
      {porCampana.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-muted">
            Gasto vs. resultados por campaña (top 10)
          </h2>
          <div className="space-y-3">
            {porCampana.map((c) => (
              <div key={c.campana} className="text-xs">
                <div className="mb-1 flex justify-between">
                  <span className="truncate pr-2 font-medium">{c.campana}</span>
                  <span className="shrink-0 text-muted">
                    {fmtCOP(c.gasto)} · {fmtNum(c.resultados)} res.
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded bg-surface-2">
                  <div
                    className="bg-brand"
                    style={{ width: `${(c.gasto / maxGasto) * 100}%` }}
                  />
                </div>
                <div className="mt-1 flex h-2 overflow-hidden rounded bg-surface-2">
                  <div
                    className="bg-ok"
                    style={{ width: `${(c.resultados / maxRes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-brand" /> Gasto
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-ok" /> Resultados
            </span>
          </div>
        </section>
      )}

      {/* Filtros + tabla */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <input
            value={fCampana}
            onChange={(e) => setFCampana(e.target.value)}
            placeholder="Filtrar campaña…"
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
          />
          <select
            value={fObjetivo}
            onChange={(e) => setFObjetivo(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Todos los objetivos</option>
            {objetivos.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={fDesde}
            onChange={(e) => setFDesde(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <input
            type="date"
            value={fHasta}
            onChange={(e) => setFHasta(e.target.value)}
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-2 font-medium">Campaña</th>
                <th className="p-2 font-medium">Objetivo</th>
                <th className="p-2 text-right font-medium">Alcance</th>
                <th className="p-2 text-right font-medium">Gasto</th>
                <th className="p-2 text-right font-medium">Resultados</th>
                <th className="p-2 text-right font-medium">CTR</th>
                <th className="p-2 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted">
                    Sin datos. Subí un CSV para empezar.
                  </td>
                </tr>
              )}
              {filtradas.slice(0, 200).map((f) => (
                <tr key={f.id} className="border-b border-border/60">
                  <td className="p-2 font-medium">{f.campana ?? "—"}</td>
                  <td className="p-2 text-muted">{f.objetivo ?? "—"}</td>
                  <td className="p-2 text-right">{fmtNum(f.alcance)}</td>
                  <td className="p-2 text-right">{fmtCOP(f.gasto_cop)}</td>
                  <td className="p-2 text-right">{fmtNum(f.resultados)}</td>
                  <td className="p-2 text-right">
                    {f.ctr === null ? "—" : `${f.ctr}%`}
                  </td>
                  <td className="p-2 text-muted">{f.fecha ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtradas.length > 200 && (
            <p className="mt-2 text-xs text-muted">
              Mostrando 200 de {filtradas.length} filas.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
