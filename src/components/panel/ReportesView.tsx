"use client";

import { useState, useTransition } from "react";
import { guardarNotaReporte } from "@/app/panel/reportes/actions";

export interface ReporteData {
  esAdmin: boolean;
  general: {
    diasRestantes: number | null;
    standsTotal: number;
    standsVendidos: number;
    pctStandsVendidos: number;
    patrocinioTotal: number;
    patrocinioPagado: number;
    pctPatrocinio: number;
    ponentesAceptados: number;
    balance: number;
    criticasTotales: number;
  } | null;
  areas: {
    slug: string;
    label: string;
    completadas: number;
    pendientes: number;
    en_proceso: number;
    bloqueadas: number;
    criticas: number;
  }[];
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function ReportesView({ data }: { data: ReporteData }) {
  const [tab, setTab] = useState<"general" | "area">(
    data.esAdmin ? "general" : "area",
  );
  const [areaSel, setAreaSel] = useState(data.areas[0]?.slug ?? "");

  const area = data.areas.find((a) => a.slug === areaSel);
  const reporteActual =
    tab === "general" ? "Estado general" : `Área: ${area?.label ?? ""}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted">Vista cruzada de toda la feria.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {data.esAdmin && (
          <TabBtn activo={tab === "general"} onClick={() => setTab("general")}>
            Estado general
          </TabBtn>
        )}
        <TabBtn activo={tab === "area"} onClick={() => setTab("area")}>
          Por área
        </TabBtn>
      </div>

      {tab === "general" && data.general && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi
              label="Días para el evento"
              valor={data.general.diasRestantes ?? "—"}
            />
            <Kpi
              label="Stands vendidos"
              valor={`${data.general.pctStandsVendidos}%`}
              sub={`${data.general.standsVendidos}/${data.general.standsTotal}`}
            />
            <Kpi
              label="Patrocinios facturados"
              valor={`${data.general.pctPatrocinio}%`}
              sub={fmtCOP(data.general.patrocinioPagado)}
            />
            <Kpi
              label="Ponentes aceptados"
              valor={data.general.ponentesAceptados}
            />
            <Kpi
              label="Balance financiero"
              valor={fmtCOP(data.general.balance)}
              acento={data.general.balance >= 0 ? "ok" : "danger"}
            />
            <Kpi
              label="Tareas críticas vencidas"
              valor={data.general.criticasTotales}
              acento={data.general.criticasTotales > 0 ? "danger" : undefined}
            />
          </div>
          <ExportBar reporte="general" />
        </>
      )}

      {tab === "area" && (
        <>
          <select
            value={areaSel}
            onChange={(e) => setAreaSel(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {data.areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.label}
              </option>
            ))}
          </select>

          {area && (
            <>
              <div className="grid gap-4 sm:grid-cols-4">
                <Kpi label="Completadas" valor={area.completadas} acento="ok" />
                <Kpi label="En proceso" valor={area.en_proceso} />
                <Kpi label="Pendientes" valor={area.pendientes} />
                <Kpi
                  label="Bloqueadas"
                  valor={area.bloqueadas}
                  acento={area.bloqueadas > 0 ? "danger" : undefined}
                />
              </div>
              <Avance area={area} />
              <ExportBar reporte="area" area={area.slug} />
            </>
          )}
          {data.areas.length === 0 && (
            <p className="text-sm text-muted">No hay áreas con datos.</p>
          )}
        </>
      )}

      <NotasReporte reporte={reporteActual} />
    </div>
  );
}

function Avance({ area }: { area: ReporteData["areas"][number] }) {
  const total =
    area.completadas + area.en_proceso + area.pendientes + area.bloqueadas;
  const pct = total ? Math.round((area.completadas / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted">Avance del área</span>
        <span className="font-medium text-brand">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ExportBar({ reporte, area }: { reporte: string; area?: string }) {
  const q = new URLSearchParams({ reporte, ...(area ? { area } : {}) });
  return (
    <div className="flex gap-3">
      <a
        href={`/panel/reportes/export?formato=pdf&${q}`}
        className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-brand/50 hover:text-foreground"
      >
        Exportar PDF
      </a>
      <a
        href={`/panel/reportes/export?formato=csv&${q}`}
        className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-brand/50 hover:text-foreground"
      >
        Exportar CSV
      </a>
    </div>
  );
}

function NotasReporte({ reporte }: { reporte: string }) {
  const [texto, setTexto] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      const r = await guardarNotaReporte({ reporte, texto });
      setMsg(r.mensaje ?? "");
      if (r.ok) setTexto("");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-2 text-sm font-semibold text-muted">
        Observación (se guarda en Estrategia)
      </h2>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder={`Nota sobre "${reporte}"…`}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={pending || texto.trim().length < 3}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar nota"}
        </button>
        {msg && <span className="text-xs text-muted">{msg}</span>}
      </div>
    </div>
  );
}

function TabBtn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm ${
        activo
          ? "border-brand font-medium text-brand"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Kpi({
  label,
  valor,
  sub,
  acento,
}: {
  label: string;
  valor: string | number;
  sub?: string;
  acento?: "ok" | "danger";
}) {
  const color =
    acento === "ok"
      ? "text-ok"
      : acento === "danger"
        ? "text-danger"
        : "text-brand";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
