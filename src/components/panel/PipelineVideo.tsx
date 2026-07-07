"use client";

import { useState, useTransition } from "react";
import {
  crearPiezaVideo,
  moverEtapaVideo,
  type EtapaVideo,
  type TipoVideo,
} from "@/app/panel/video/actions";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface PiezaView {
  id: string;
  titulo: string;
  tipo: TipoVideo;
  etapa: EtapaVideo;
  fecha_publicacion_objetivo: string | null;
}

const ETAPAS: { key: EtapaVideo; label: string }[] = [
  { key: "guion", label: "Guion" },
  { key: "grabacion", label: "Grabación" },
  { key: "edicion", label: "Edición" },
  { key: "revision", label: "Revisión" },
  { key: "publicado", label: "Publicado" },
];

const TIPOS: TipoVideo[] = [
  "testimonio",
  "backstage",
  "ponente",
  "recap",
  "publicitario",
];

const fecha = (f: string | null) =>
  f
    ? new Date(f).toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
      })
    : "—";

export function PipelineVideo({
  piezas,
  puedeEditar,
}: {
  piezas: PiezaView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  const columnas: ColumnaTabla<PiezaView>[] = [
    {
      label: "Título",
      get: (p) => <span className="font-medium">{p.titulo}</span>,
    },
    { label: "Tipo", get: (p) => <span className="capitalize">{p.tipo}</span> },
    { label: "Publicación", get: (p) => fecha(p.fecha_publicacion_objetivo) },
  ];

  const renderCard = (p: PiezaView) => (
    <>
      <p className="text-sm font-medium leading-snug">{p.titulo}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 capitalize text-muted">
          {p.tipo}
        </span>
        {p.fecha_publicacion_objetivo && (
          <span className="ml-auto text-muted">
            {fecha(p.fecha_publicacion_objetivo)}
          </span>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Video</h1>
        <p className="text-sm text-muted">
          Producción de contenido.{!puedeEditar && " Solo lectura."}
        </p>
      </div>

      {abrir && puedeEditar && (
        <NuevaPiezaForm onCreada={() => setAbrir(false)} />
      )}

      <TableroConVistas<PiezaView>
        items={piezas}
        getId={(p) => p.id}
        campoEtapa="etapa"
        etapas={ETAPAS}
        columnas={columnas}
        renderCard={renderCard}
        onMover={(id, etapa) => moverEtapaVideo(id, etapa as EtapaVideo)}
        puedeEditar={puedeEditar}
        acciones={
          puedeEditar ? (
            <button
              onClick={() => setAbrir((v) => !v)}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              {abrir ? "Cerrar" : "+ Nueva pieza"}
            </button>
          ) : undefined
        }
      />
    </div>
  );
}

function NuevaPiezaForm({ onCreada }: { onCreada: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoVideo>("recap");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 3) return;
    setError("");
    startTransition(async () => {
      const r = await crearPiezaVideo({ titulo, tipo });
      if (r.ok) {
        setTitulo("");
        setTipo("recap");
        onCreada();
      } else setError(r.mensaje ?? "No se pudo crear.");
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[2fr_1fr_auto]"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la pieza de video"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoVideo)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Crear"}
      </button>
      {error && <p className="text-sm text-warn sm:col-span-3">{error}</p>}
    </form>
  );
}
