"use client";

import { useMemo, useState, useTransition } from "react";
import {
  crearOkr,
  crearResultadoClave,
  actualizarEstadoOkr,
  actualizarValorRc,
  registrarCheckin,
} from "@/app/panel/okrs/actions";

type EstadoOkr = "en_curso" | "cumplido" | "en_riesgo" | "abandonado";

export interface RcView {
  id: string;
  descripcion: string;
  valor_meta: number | null;
  valor_actual: number | null;
  unidad: string | null;
  progreso_calculado: number;
  kpi_relacionado_id: string | null;
}
export interface CheckinView {
  id: string;
  fecha: string;
  comentario: string | null;
}
export interface OkrView {
  id: string;
  titulo_objetivo: string;
  descripcion: string | null;
  periodo: string;
  estado: EstadoOkr;
  area: string | null;
  resultados: RcView[];
  checkins: CheckinView[];
}
export interface KpiOpcion {
  id: string;
  nombre: string;
}
export interface AreaOpcion {
  slug: string;
  label: string;
}

const ESTADOS: EstadoOkr[] = [
  "en_curso",
  "cumplido",
  "en_riesgo",
  "abandonado",
];
const ESTADO_LABEL: Record<EstadoOkr, string> = {
  en_curso: "En curso",
  cumplido: "Cumplido",
  en_riesgo: "En riesgo",
  abandonado: "Abandonado",
};
const ESTADO_STYLE: Record<EstadoOkr, string> = {
  en_curso: "border-brand/50 bg-brand-soft/30 text-brand",
  cumplido: "border-ok/50 bg-ok/10 text-ok",
  en_riesgo: "border-danger/50 bg-danger/10 text-danger",
  abandonado: "border-border bg-surface-2 text-muted",
};

const promedio = (o: OkrView) =>
  o.resultados.length === 0
    ? 0
    : Math.round(
        o.resultados.reduce((s, r) => s + Number(r.progreso_calculado), 0) /
          o.resultados.length,
      );

function Barra({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export function OkrsView({
  okrs,
  kpis,
  areasEditables,
  esAdmin,
}: {
  okrs: OkrView[];
  kpis: KpiOpcion[];
  areasEditables: AreaOpcion[];
  esAdmin: boolean;
}) {
  const [fArea, setFArea] = useState<string>("todas");
  const [fEstado, setFEstado] = useState<string>("todos");
  const [abrirNuevo, setAbrirNuevo] = useState(false);

  const filtrados = useMemo(() => {
    const orden: Record<EstadoOkr, number> = {
      en_riesgo: 0,
      en_curso: 1,
      cumplido: 2,
      abandonado: 3,
    };
    return okrs
      .filter((o) =>
        fArea === "todas" ? true : (o.area ?? "transversal") === fArea,
      )
      .filter((o) => (fEstado === "todos" ? true : o.estado === fEstado))
      .sort((a, b) => orden[a.estado] - orden[b.estado]);
  }, [okrs, fArea, fEstado]);

  const areasEnUso = Array.from(
    new Set(okrs.map((o) => o.area ?? "transversal")),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OKRs</h1>
          <p className="text-sm text-muted">
            Objetivos y resultados clave.{" "}
            {esAdmin && "Vista consolidada — en riesgo primero."}
          </p>
        </div>
        <button
          onClick={() => setAbrirNuevo((v) => !v)}
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
        >
          {abrirNuevo ? "Cerrar" : "+ Nuevo OKR"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={fArea}
          onChange={(e) => setFArea(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="todas">Todas las áreas</option>
          {areasEnUso.map((a) => (
            <option key={a} value={a}>
              {a === "transversal" ? "Transversal" : a}
            </option>
          ))}
        </select>
        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
      </div>

      {abrirNuevo && (
        <NuevoOkrForm
          areasEditables={areasEditables}
          esAdmin={esAdmin}
          onCreado={() => setAbrirNuevo(false)}
        />
      )}

      <div className="space-y-4">
        {filtrados.length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
            No hay OKRs para el filtro actual.
          </p>
        )}
        {filtrados.map((o) => (
          <OkrCard key={o.id} okr={o} kpis={kpis} />
        ))}
      </div>
    </div>
  );
}

function OkrCard({ okr, kpis }: { okr: OkrView; kpis: KpiOpcion[] }) {
  const [pending, startTransition] = useTransition();
  const [abrirRc, setAbrirRc] = useState(false);
  const [abrirCheckin, setAbrirCheckin] = useState(false);
  const general = promedio(okr);

  function cambiarEstado(estado: string) {
    startTransition(async () => {
      await actualizarEstadoOkr(okr.id, estado);
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{okr.titulo_objetivo}</h2>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_STYLE[okr.estado]}`}
            >
              {ESTADO_LABEL[okr.estado]}
            </span>
          </div>
          <p className="text-xs text-muted">
            {okr.area ? okr.area : "Transversal"} · {okr.periodo}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand">{general}%</p>
          <p className="text-xs text-muted">progreso general</p>
        </div>
      </div>

      <div className="mt-3">
        <Barra pct={general} />
      </div>

      <div className="mt-4 space-y-3">
        {okr.resultados.map((rc) => (
          <RcFila
            key={rc.id}
            rc={rc}
            pending={pending}
            startTransition={startTransition}
          />
        ))}
        {okr.resultados.length === 0 && (
          <p className="text-xs text-muted">Sin resultados clave todavía.</p>
        )}
      </div>

      {okr.checkins.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-surface-2/40 p-3">
          <p className="mb-1 text-xs font-semibold text-muted">
            Check-ins recientes
          </p>
          <ul className="space-y-1 text-xs text-muted">
            {okr.checkins.slice(0, 3).map((c) => (
              <li key={c.id}>
                <span className="text-foreground">{c.fecha}</span> —{" "}
                {c.comentario ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <button
          onClick={() => setAbrirCheckin((v) => !v)}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
        >
          Registrar check-in
        </button>
        <button
          onClick={() => setAbrirRc((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
        >
          + Resultado clave
        </button>
        <select
          value={okr.estado}
          disabled={pending}
          onChange={(e) => cambiarEstado(e.target.value)}
          className="ml-auto rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
        >
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
      </div>

      {abrirCheckin && (
        <CheckinForm okrId={okr.id} onListo={() => setAbrirCheckin(false)} />
      )}
      {abrirRc && (
        <RcForm okrId={okr.id} kpis={kpis} onListo={() => setAbrirRc(false)} />
      )}
    </section>
  );
}

function RcFila({
  rc,
  pending,
  startTransition,
}: {
  rc: RcView;
  pending: boolean;
  startTransition: (cb: () => void) => void;
}) {
  const [editar, setEditar] = useState(false);
  const [valor, setValor] = useState(String(rc.valor_actual ?? 0));
  const manual = !rc.kpi_relacionado_id;

  function guardar() {
    startTransition(async () => {
      await actualizarValorRc(rc.id, Number(valor) || 0);
      setEditar(false);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>{rc.descripcion}</span>
        <span className="shrink-0 text-xs text-muted">
          {Number(rc.valor_actual ?? 0).toLocaleString("es-CO")} /{" "}
          {Number(rc.valor_meta ?? 0).toLocaleString("es-CO")} {rc.unidad ?? ""}
          {!manual && " · auto"}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <Barra pct={Number(rc.progreso_calculado)} />
        <span className="w-10 shrink-0 text-right text-xs text-muted">
          {Math.round(Number(rc.progreso_calculado))}%
        </span>
        {manual &&
          (editar ? (
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onBlur={guardar}
              type="number"
              autoFocus
              disabled={pending}
              className="w-20 rounded border border-border bg-surface-2 px-2 py-0.5 text-xs outline-none focus:border-brand"
            />
          ) : (
            <button
              onClick={() => setEditar(true)}
              className="text-xs text-brand hover:underline"
            >
              editar
            </button>
          ))}
      </div>
    </div>
  );
}

function NuevoOkrForm({
  areasEditables,
  esAdmin,
  onCreado,
}: {
  areasEditables: AreaOpcion[];
  esAdmin: boolean;
  onCreado: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periodo, setPeriodo] = useState("Feria Effix 2026");
  const [areaSlug, setAreaSlug] = useState<string>(
    esAdmin ? "" : (areasEditables[0]?.slug ?? ""),
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function crear(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await crearOkr({
        titulo,
        descripcion,
        periodo,
        areaSlug: areaSlug === "" ? null : areaSlug,
      });
      if (r.ok) {
        setTitulo("");
        setDescripcion("");
        onCreado();
      } else setError(r.mensaje ?? "No se pudo crear.");
    });
  }

  return (
    <form
      onSubmit={crear}
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Objetivo (ej. Hacer la edición más grande)"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          placeholder="Período"
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <select
          value={areaSlug}
          onChange={(e) => setAreaSlug(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {esAdmin && <option value="">Transversal (toda la feria)</option>}
          {areasEditables.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-warn">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear OKR"}
      </button>
    </form>
  );
}

function RcForm({
  okrId,
  kpis,
  onListo,
}: {
  okrId: string;
  kpis: KpiOpcion[];
  onListo: () => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [unidad, setUnidad] = useState("");
  const [kpiId, setKpiId] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (descripcion.trim().length < 3) return;
    startTransition(async () => {
      const r = await crearResultadoClave({
        okrId,
        descripcion,
        valorMeta: Number(valorMeta) || 0,
        unidad,
        kpiId: kpiId || null,
      });
      if (r.ok) onListo();
    });
  }

  return (
    <form
      onSubmit={crear}
      className="mt-3 grid gap-3 rounded-lg border border-border bg-surface-2/40 p-3 sm:grid-cols-2"
    >
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Resultado clave"
        required
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand sm:col-span-2"
      />
      <input
        value={valorMeta}
        onChange={(e) => setValorMeta(e.target.value)}
        placeholder="Meta (número)"
        type="number"
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={unidad}
        onChange={(e) => setUnidad(e.target.value)}
        placeholder="Unidad (ej. COP, asistentes)"
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={kpiId}
        onChange={(e) => setKpiId(e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand sm:col-span-2"
      >
        <option value="">Sin KPI (progreso manual)</option>
        {kpis.map((k) => (
          <option key={k.id} value={k.id}>
            Vincular a KPI: {k.nombre}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Guardando…" : "Agregar resultado clave"}
      </button>
    </form>
  );
}

function CheckinForm({
  okrId,
  onListo,
}: {
  okrId: string;
  onListo: () => void;
}) {
  const [comentario, setComentario] = useState("");
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (comentario.trim().length < 2) return;
    startTransition(async () => {
      const r = await registrarCheckin(okrId, comentario);
      if (r.ok) onListo();
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-3 space-y-2 rounded-lg border border-border bg-surface-2/40 p-3"
    >
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="¿Qué pasó esta semana con este OKR?"
        rows={2}
        className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar check-in"}
      </button>
    </form>
  );
}
