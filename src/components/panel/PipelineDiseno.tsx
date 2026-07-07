"use client";

import { useState, useTransition } from "react";
import {
  crearSolicitudDiseno,
  moverEtapaDiseno,
  type EtapaDiseno,
  type TipoPieza,
  type PrioridadDiseno,
} from "@/app/panel/diseno/actions";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface SolicitudView {
  id: string;
  titulo: string;
  tipo_pieza: TipoPieza;
  prioridad: PrioridadDiseno;
  etapa: EtapaDiseno;
  fecha_limite: string | null;
  solicitante: string | null;
}

export interface AreaOpcion {
  id: string;
  label: string;
}

const ETAPAS: { key: EtapaDiseno; label: string }[] = [
  { key: "solicitado", label: "Solicitado" },
  { key: "en_diseno", label: "En diseño" },
  { key: "en_revision", label: "En revisión" },
  { key: "aprobado", label: "Aprobado" },
  { key: "entregado", label: "Entregado" },
];

const TIPOS: TipoPieza[] = [
  "escarapela",
  "banner",
  "redes_sociales",
  "impreso",
  "senaletica",
  "otro",
];

const PRIORIDAD_STYLE: Record<PrioridadDiseno, string> = {
  urgente: "border-danger/50 bg-danger/10 text-danger",
  alta: "border-warn/50 bg-warn/10 text-warn",
  media: "border-border bg-surface-2 text-muted",
  baja: "border-border bg-surface-2 text-muted",
};

const fecha = (f: string | null) =>
  f
    ? new Date(f).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      })
    : "—";

export function PipelineDiseno({
  solicitudes,
  areas,
  puedeEditar,
}: {
  solicitudes: SolicitudView[];
  areas: AreaOpcion[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  const columnas: ColumnaTabla<SolicitudView>[] = [
    {
      label: "Título",
      get: (s) => <span className="font-medium">{s.titulo}</span>,
    },
    { label: "Tipo", get: (s) => s.tipo_pieza.replace("_", " ") },
    {
      label: "Prioridad",
      get: (s) => (
        <span
          className={`rounded-full border px-2 py-0.5 text-xs ${PRIORIDAD_STYLE[s.prioridad]}`}
        >
          {s.prioridad}
        </span>
      ),
    },
    { label: "Solicita", get: (s) => s.solicitante ?? "—" },
    { label: "Fecha límite", get: (s) => fecha(s.fecha_limite) },
  ];

  const renderCard = (s: SolicitudView) => (
    <>
      <p className="text-sm font-medium leading-snug">{s.titulo}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-muted">
          {s.tipo_pieza.replace("_", " ")}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 ${PRIORIDAD_STYLE[s.prioridad]}`}
        >
          {s.prioridad}
        </span>
        {s.fecha_limite && (
          <span className="ml-auto text-muted">{fecha(s.fecha_limite)}</span>
        )}
      </div>
      {s.solicitante && (
        <p className="mt-1 text-xs text-muted">Pide: {s.solicitante}</p>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Diseño</h1>
        <p className="text-sm text-muted">
          Solicitudes de piezas.{!puedeEditar && " Solo lectura."}
        </p>
      </div>

      {abrir && puedeEditar && (
        <NuevaSolicitudForm areas={areas} onCreada={() => setAbrir(false)} />
      )}

      <TableroConVistas<SolicitudView>
        items={solicitudes}
        getId={(s) => s.id}
        campoEtapa="etapa"
        etapas={ETAPAS}
        columnas={columnas}
        renderCard={renderCard}
        onMover={(id, etapa) => moverEtapaDiseno(id, etapa as EtapaDiseno)}
        puedeEditar={puedeEditar}
        acciones={
          puedeEditar ? (
            <button
              onClick={() => setAbrir((v) => !v)}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              {abrir ? "Cerrar" : "+ Nueva solicitud"}
            </button>
          ) : undefined
        }
      />
    </div>
  );
}

function NuevaSolicitudForm({
  areas,
  onCreada,
}: {
  areas: AreaOpcion[];
  onCreada: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoPieza>("otro");
  const [prioridad, setPrioridad] = useState<PrioridadDiseno>("media");
  const [area, setArea] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 3) return;
    setError("");
    startTransition(async () => {
      const r = await crearSolicitudDiseno({
        titulo,
        tipo_pieza: tipo,
        prioridad,
        area_solicitante: area || null,
      });
      if (r.ok) {
        setTitulo("");
        setTipo("otro");
        setPrioridad("media");
        setArea("");
        onCreada();
      } else setError(r.mensaje ?? "No se pudo crear.");
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la pieza"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoPieza)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {t.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        value={prioridad}
        onChange={(e) => setPrioridad(e.target.value as PrioridadDiseno)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        <option value="urgente">Urgente</option>
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="baja">Baja</option>
      </select>
      <select
        value={area}
        onChange={(e) => setArea(e.target.value)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">— Área solicitante —</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-warn sm:col-span-2 lg:col-span-4">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2 lg:col-span-4"
      >
        {pending ? "Guardando…" : "Crear solicitud"}
      </button>
    </form>
  );
}
