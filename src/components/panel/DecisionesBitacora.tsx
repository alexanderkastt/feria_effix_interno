"use client";

import { useMemo, useState, useTransition } from "react";
import { crearDecision } from "@/app/panel/pipeline-actions";

export interface DecisionView {
  id: string;
  titulo: string;
  contexto: string | null;
  decision_tomada: string | null;
  fecha: string;
  tags: string[];
  responsable: string | null;
}

export function DecisionesBitacora({
  decisiones,
  puedeEditar,
}: {
  decisiones: DecisionView[];
  puedeEditar: boolean;
}) {
  const [filtro, setFiltro] = useState("");
  const [abrir, setAbrir] = useState(false);

  const filtradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return decisiones;
    return decisiones.filter(
      (d) =>
        d.titulo.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [filtro, decisiones]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estrategia</h1>
          <p className="text-sm text-muted">
            Bitácora de decisiones estructurales del evento.
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setAbrir((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            {abrir ? "Cerrar" : "+ Registrar decisión"}
          </button>
        )}
      </div>

      {abrir && puedeEditar && (
        <NuevaDecisionForm onCreada={() => setAbrir(false)} />
      )}

      <input
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Buscar por título o tag…"
        className="w-full max-w-md rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />

      <ol className="relative space-y-4 border-l border-border pl-6">
        {filtradas.length === 0 && (
          <li className="text-sm text-muted">Sin decisiones registradas.</li>
        )}
        {filtradas.map((d) => (
          <li key={d.id} className="relative">
            <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
            <article className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{d.titulo}</h3>
                <span className="text-xs text-muted">
                  {new Date(d.fecha).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {d.contexto && (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-foreground">
                    Contexto:{" "}
                  </span>
                  {d.contexto}
                </p>
              )}
              {d.decision_tomada && (
                <p className="mt-1 text-sm">
                  <span className="font-medium text-brand">Decisión: </span>
                  {d.decision_tomada}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {d.tags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltro(t)}
                    className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted hover:text-brand"
                  >
                    #{t}
                  </button>
                ))}
                {d.responsable && (
                  <span className="ml-auto text-xs text-muted">
                    {d.responsable}
                  </span>
                )}
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

function NuevaDecisionForm({ onCreada }: { onCreada: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [contexto, setContexto] = useState("");
  const [decision, setDecision] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 3) return;
    setError("");
    startTransition(async () => {
      const r = await crearDecision({
        titulo,
        contexto,
        decision_tomada: decision,
        tags: tags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
      if (r.ok) {
        setTitulo("");
        setContexto("");
        setDecision("");
        setTags("");
        onCreada();
      } else {
        setError(r.mensaje ?? "No se pudo registrar.");
      }
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
        placeholder="Título de la decisión"
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <textarea
        value={contexto}
        onChange={(e) => setContexto(e.target.value)}
        placeholder="Contexto: qué se evaluó…"
        rows={2}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <textarea
        value={decision}
        onChange={(e) => setDecision(e.target.value)}
        placeholder="Decisión tomada…"
        rows={2}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags separados por coma (precios, fechas…)"
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      {error && <p className="text-sm text-warn">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Registrar decisión"}
      </button>
    </form>
  );
}
