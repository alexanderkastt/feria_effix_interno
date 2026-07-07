"use client";

import { useState, useTransition } from "react";
import { ESTADOS, type EstadoTarea, type Prioridad } from "@/lib/demo";
import {
  crearTransversal,
  moverTransversal,
} from "@/app/panel/transversales/actions";

export interface AreaOpcion {
  id: string;
  label: string;
}

export interface TransversalItem {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  prioridad: Prioridad;
  areas: string[];
}

const PRIORIDAD_STYLE: Record<Prioridad, string> = {
  alta: "border-danger/50 bg-danger/10 text-danger",
  media: "border-warn/50 bg-warn/10 text-warn",
  baja: "border-border bg-surface-2 text-muted",
};

const ORDEN: EstadoTarea[] = ESTADOS.map((e) => e.key);

export function TransversalesView({
  tareas,
  areaOpciones,
  puedeCrear,
}: {
  tareas: TransversalItem[];
  areaOpciones: AreaOpcion[];
  puedeCrear: boolean;
}) {
  const [abrir, setAbrir] = useState(false);
  const [pending, startTransition] = useTransition();

  function mover(id: string, estado: EstadoTarea) {
    startTransition(async () => {
      await moverTransversal(id, estado);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Tareas transversales
          </h1>
          <p className="text-sm text-muted">
            Tareas que cruzan más de un área. Aparecen también en el tablero de
            cada área involucrada.
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={() => setAbrir((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
          >
            {abrir ? "Cerrar" : "+ Nueva transversal"}
          </button>
        )}
      </div>

      {abrir && puedeCrear && (
        <NuevaTransversalForm
          areaOpciones={areaOpciones}
          onCreada={() => setAbrir(false)}
        />
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
                    className="rounded-lg border border-brand/30 bg-surface p-3"
                  >
                    <p className="text-sm font-medium leading-snug">
                      {t.titulo}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.areas.map((a) => (
                        <span
                          key={a}
                          className="rounded-full border border-brand/40 bg-brand-soft/20 px-2 py-0.5 text-[10px] text-brand"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full border px-2 py-0.5 ${PRIORIDAD_STYLE[t.prioridad]}`}
                      >
                        {t.prioridad}
                      </span>
                    </div>
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

function NuevaTransversalForm({
  areaOpciones,
  onCreada,
}: {
  areaOpciones: AreaOpcion[];
  onCreada: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState<Prioridad>("media");
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (titulo.trim().length < 3) return setError("Falta el título.");
    if (seleccionadas.length === 0)
      return setError("Elegí al menos un área involucrada.");
    startTransition(async () => {
      const r = await crearTransversal({
        titulo: titulo.trim(),
        descripcion,
        prioridad,
        areasInvolucradas: seleccionadas,
      });
      if (r.ok) {
        setTitulo("");
        setDescripcion("");
        setPrioridad("media");
        setSeleccionadas([]);
        onCreada();
      } else {
        setError(r.mensaje ?? "No se pudo crear.");
      }
    });
  }

  return (
    <form
      onSubmit={crear}
      className="space-y-4 rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título de la tarea transversal"
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
      </div>

      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
        rows={2}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />

      <div>
        <p className="mb-2 text-sm font-medium">Áreas involucradas</p>
        <div className="flex flex-wrap gap-2">
          {areaOpciones.map((a) => {
            const activa = seleccionadas.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggle(a.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activa
                    ? "border-brand bg-brand-soft/40 text-brand"
                    : "border-border text-muted hover:border-brand/50"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear tarea transversal"}
      </button>
    </form>
  );
}
