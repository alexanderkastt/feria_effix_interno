"use client";

import { useState, useTransition } from "react";
import { ESTADOS, type EstadoTarea, type Prioridad } from "@/lib/demo";
import { crearTarea, moverTarea } from "@/app/panel/[area]/actions";

export interface TareaView {
  id: string;
  titulo: string;
  estado: EstadoTarea;
  prioridad: Prioridad;
  fecha_limite: string | null;
  responsable: string | null;
}

export interface TransversalView {
  id: string;
  titulo: string;
  estado: EstadoTarea;
  prioridad: Prioridad;
}

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  bloqueado: "Bloqueado",
  hecho: "Hecho",
};

const PRIORIDAD_STYLE: Record<Prioridad, string> = {
  alta: "border-danger/50 bg-danger/10 text-danger",
  media: "border-warn/50 bg-warn/10 text-warn",
  baja: "border-border bg-surface-2 text-muted",
};

const ORDEN: EstadoTarea[] = ESTADOS.map((e) => e.key);

export function KanbanInteractive({
  areaId,
  areaSlug,
  label,
  tareas,
  puedeEditar,
  transversales = [],
}: {
  areaId: string;
  areaSlug: string;
  label: string;
  tareas: TareaView[];
  puedeEditar: boolean;
  transversales?: TransversalView[];
}) {
  const [abrirForm, setAbrirForm] = useState(false);
  const [pending, startTransition] = useTransition();

  function mover(id: string, estado: EstadoTarea) {
    startTransition(async () => {
      await moverTarea({ id, estado, areaSlug });
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
          <p className="text-sm text-muted">
            Tablero de tareas del área.
            {!puedeEditar && " Tenés acceso de solo lectura."}
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setAbrirForm((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
          >
            {abrirForm ? "Cerrar" : "+ Nueva tarea"}
          </button>
        )}
      </div>

      {abrirForm && puedeEditar && (
        <NuevaTareaForm
          areaId={areaId}
          areaSlug={areaSlug}
          onCreada={() => setAbrirForm(false)}
        />
      )}

      {transversales.length > 0 && (
        <section className="rounded-xl border border-brand/30 bg-brand-soft/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-xs font-medium text-brand">
              Transversales
            </span>
            <span className="text-xs text-muted">
              Tareas que involucran a esta y otras áreas. Se gestionan en Tareas
              transversales.
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {transversales.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <p className="text-sm font-medium leading-snug">{t.titulo}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className={`rounded-full border px-2 py-0.5 ${PRIORIDAD_STYLE[t.prioridad]}`}
                  >
                    {t.prioridad}
                  </span>
                  <span className="text-muted">{ESTADO_LABEL[t.estado]}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div
        className={`grid gap-4 md:grid-cols-4 ${pending ? "opacity-70" : ""}`}
      >
        {ESTADOS.map((col, colIdx) => {
          const items = tareas.filter((t) => t.estado === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col rounded-xl border border-border bg-surface/60 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <article
                    key={t.id}
                    className="rounded-lg border border-border bg-surface p-3 transition-colors hover:border-brand/50"
                  >
                    <p className="text-sm font-medium leading-snug">
                      {t.titulo}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${PRIORIDAD_STYLE[t.prioridad]}`}
                      >
                        {t.prioridad}
                      </span>
                      {t.responsable && (
                        <span className="text-muted">{t.responsable}</span>
                      )}
                      {t.fecha_limite && (
                        <span className="ml-auto text-muted">
                          {new Date(t.fecha_limite).toLocaleDateString(
                            "es-CO",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </span>
                      )}
                    </div>
                    {puedeEditar && (
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
                        <button
                          disabled={colIdx === 0 || pending}
                          onClick={() => mover(t.id, ORDEN[colIdx - 1])}
                          className="rounded px-1.5 py-0.5 text-xs text-muted enabled:hover:text-brand disabled:opacity-30"
                        >
                          ← Atrás
                        </button>
                        <button
                          disabled={colIdx === ORDEN.length - 1 || pending}
                          onClick={() => mover(t.id, ORDEN[colIdx + 1])}
                          className="rounded px-1.5 py-0.5 text-xs text-muted enabled:hover:text-brand disabled:opacity-30"
                        >
                          Avanzar →
                        </button>
                      </div>
                    )}
                  </article>
                ))}

                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-muted">
                    Sin tareas
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NuevaTareaForm({
  areaId,
  areaSlug,
  onCreada,
}: {
  areaId: string;
  areaSlug: string;
  onCreada: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("media");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 3) return;
    startTransition(async () => {
      const r = await crearTarea({
        areaId,
        areaSlug,
        titulo: titulo.trim(),
        prioridad,
      });
      if (r.ok) {
        setTitulo("");
        setPrioridad("media");
        onCreada();
      }
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-[2fr_auto_auto]"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la tarea"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={prioridad}
        onChange={(e) => setPrioridad(e.target.value as Prioridad)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="alta">Alta</option>
        <option value="media">Media</option>
        <option value="baja">Baja</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear"}
      </button>
    </form>
  );
}
