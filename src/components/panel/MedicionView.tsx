"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  recalcularKpis,
  cargarValorManual,
} from "@/app/panel/medicion/actions";

type Unidad = "numero" | "porcentaje" | "moneda" | "dias";

export interface KpiRow {
  id: string;
  nombre: string;
  unidad: Unidad;
  tipo_calculo: "automatico" | "manual";
  meta: number | null;
  area: string | null;
  valor: number | null;
}

export interface OkrRow {
  id: string;
  titulo: string;
  estado: string;
  progreso: number;
  resultados: {
    descripcion: string;
    progreso: number;
    valor_meta: number | null;
    valor_actual: number | null;
    unidad: string | null;
  }[];
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

function fmtValor(v: number | null, u: Unidad): string {
  if (v === null) return "—";
  if (u === "porcentaje") return `${v.toFixed(1)}%`;
  if (u === "moneda") return fmtCOP(v);
  if (u === "dias") return `${Math.round(v)} d`;
  return new Intl.NumberFormat("es-CO").format(v);
}

// Semáforo: verde ≥90% de la meta, amarillo 70–89%, rojo <70%.
// Si meta es null o ≤0 (ej. "0 urgentes"), no hay ratio → neutral.
function semaforo(valor: number | null, meta: number | null) {
  if (valor === null || meta === null || meta <= 0) {
    return {
      clase: "border-border bg-surface-2 text-muted",
      pct: null as number | null,
    };
  }
  const pct = (valor / meta) * 100;
  if (pct >= 90) return { clase: "border-ok/50 bg-ok/10 text-ok", pct };
  if (pct >= 70) return { clase: "border-warn/50 bg-warn/10 text-warn", pct };
  return { clase: "border-danger/50 bg-danger/10 text-danger", pct };
}

export function MedicionView({
  okrs,
  kpis,
  areas,
}: {
  okrs: OkrRow[];
  kpis: KpiRow[];
  areas: string[];
}) {
  const [filtro, setFiltro] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const manuales = kpis.filter((k) => k.tipo_calculo === "manual");

  const visibles = filtro ? kpis.filter((k) => k.area === filtro) : kpis;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Medición</h1>
          <p className="text-sm text-muted">OKRs y KPIs de Feria Effix 2026.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/panel/medicion/export"
            className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Exportar PDF
          </Link>
          <button
            onClick={() => startTransition(() => void recalcularKpis())}
            disabled={pending}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? "Recalculando…" : "Recalcular KPIs"}
          </button>
        </div>
      </div>

      {/* OKRs transversales */}
      {okrs.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          {okrs.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-brand/30 bg-brand-soft/10 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold leading-snug">{o.titulo}</h2>
                <span className="shrink-0 text-2xl font-bold text-brand">
                  {o.progreso.toFixed(0)}%
                </span>
              </div>
              <Barra pct={o.progreso} />
              <ul className="mt-4 space-y-2">
                {o.resultados.map((r, i) => (
                  <li key={i} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted">{r.descripcion}</span>
                      <span className="font-medium">
                        {r.progreso.toFixed(0)}%
                      </span>
                    </div>
                    <Barra pct={r.progreso} delgada />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* KPIs */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-muted">KPIs por área</h2>
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm outline-none focus:border-brand"
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((k) => {
            const s = semaforo(k.valor, k.meta);
            return (
              <div key={k.id} className={`rounded-xl border p-4 ${s.clase}`}>
                <p className="text-xs opacity-80">{k.area ?? "transversal"}</p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {k.nombre}
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {fmtValor(k.valor, k.unidad)}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  Meta: {k.meta === null ? "—" : fmtValor(k.meta, k.unidad)}
                  {s.pct !== null && ` · ${s.pct.toFixed(0)}%`}
                  {k.tipo_calculo === "manual" && " · manual"}
                </p>
              </div>
            );
          })}
          {visibles.length === 0 && (
            <p className="text-sm text-muted">Sin KPIs para esta área.</p>
          )}
        </div>
      </section>

      {/* Carga manual */}
      {manuales.length > 0 && <CargaManual manuales={manuales} />}
    </div>
  );
}

function Barra({ pct, delgada }: { pct: number; delgada?: boolean }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div
      className={`mt-2 w-full overflow-hidden rounded-full bg-surface-2 ${delgada ? "h-1.5" : "h-2.5"}`}
    >
      <div
        className="h-full rounded-full bg-brand"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function CargaManual({ manuales }: { manuales: KpiRow[] }) {
  const [kpiId, setKpiId] = useState(manuales[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(valor);
    if (!kpiId || !Number.isFinite(n)) return;
    startTransition(async () => {
      const r = await cargarValorManual(kpiId, n);
      setMsg(r.ok ? "Valor guardado." : (r.mensaje ?? "Error."));
      if (r.ok) setValor("");
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold text-muted">
        Cargar valor manual de KPI
      </h2>
      <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
        <select
          value={kpiId}
          onChange={(e) => setKpiId(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {manuales.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="any"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor"
          className="w-36 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </form>
    </section>
  );
}
