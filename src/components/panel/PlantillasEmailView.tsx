"use client";

import { useState, useTransition } from "react";
import {
  crearPlantilla,
  editarPlantilla,
  type PlantillaInput,
} from "@/app/panel/comunicaciones/plantillas/actions";

export interface PlantillaRow {
  id: string;
  nombre: string;
  asunto: string;
  contenido_html: string | null;
  contenido_texto: string | null;
  es_transaccional: boolean;
  area_relacionada: string | null;
}

const VACIA: PlantillaInput = {
  nombre: "",
  asunto: "",
  contenido_html: "",
  contenido_texto: "",
  es_transaccional: false,
  area_relacionada: null,
};

export function PlantillasEmailView({
  plantillas,
  areas,
  puedeEditar,
}: {
  plantillas: PlantillaRow[];
  areas: { id: string; label: string }[];
  puedeEditar: boolean;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PlantillaInput>(VACIA);
  const [mensaje, setMensaje] = useState("");
  const [pending, startTransition] = useTransition();

  function abrirNueva() {
    setEditId(null);
    setForm(VACIA);
    setMensaje("");
  }
  function abrirEdicion(p: PlantillaRow) {
    setEditId(p.id);
    setForm({
      nombre: p.nombre,
      asunto: p.asunto,
      contenido_html: p.contenido_html ?? "",
      contenido_texto: p.contenido_texto ?? "",
      es_transaccional: p.es_transaccional,
      area_relacionada: p.area_relacionada,
    });
    setMensaje("");
  }

  function insertarColor(hex: string) {
    setForm((f) => ({ ...f, contenido_html: f.contenido_html + hex }));
  }

  const variables = [
    ...new Set(
      `${form.asunto} ${form.contenido_html} ${form.contenido_texto}`.match(
        /\{\{\s*(\w+)\s*\}\}/g,
      ) ?? [],
    ),
  ];

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");
    startTransition(async () => {
      const r = editId
        ? await editarPlantilla(editId, form)
        : await crearPlantilla(form);
      if (r.ok) {
        setMensaje("Guardada ✓");
        abrirNueva();
      } else setMensaje(r.mensaje ?? "Error");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Plantillas de email
          </h1>
          <p className="text-sm text-muted">
            El footer de baja se inserta automáticamente al enviar — no lo
            pongas acá.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lista */}
        <section className="space-y-2">
          {plantillas.length === 0 && (
            <p className="text-sm text-muted">Aún no hay plantillas.</p>
          )}
          {plantillas.map((p) => (
            <button
              key={p.id}
              onClick={() => puedeEditar && abrirEdicion(p)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-brand/50"
            >
              <div>
                <p className="text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-muted">{p.asunto}</p>
              </div>
              {p.es_transaccional && (
                <span className="rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-xs text-brand">
                  transaccional
                </span>
              )}
            </button>
          ))}
        </section>

        {/* Editor */}
        {puedeEditar && (
          <form
            onSubmit={guardar}
            className="space-y-3 rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                {editId ? "Editar plantilla" : "Nueva plantilla"}
              </h2>
              {editId && (
                <button
                  type="button"
                  onClick={abrirNueva}
                  className="text-xs text-muted hover:text-foreground"
                >
                  + Nueva
                </button>
              )}
            </div>

            <input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre interno"
              required
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <input
              value={form.asunto}
              onChange={(e) => setForm({ ...form, asunto: e.target.value })}
              placeholder="Asunto (podés usar {{nombre}})"
              required
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Brand kit:</span>
              <button
                type="button"
                onClick={() => insertarColor("#0D0D0D")}
                className="rounded border border-border px-2 py-1"
              >
                #0D0D0D
              </button>
              <button
                type="button"
                onClick={() => insertarColor("#1A6FFF")}
                className="rounded border border-brand/50 px-2 py-1 text-brand"
              >
                #1A6FFF
              </button>
            </div>

            <textarea
              value={form.contenido_html}
              onChange={(e) =>
                setForm({ ...form, contenido_html: e.target.value })
              }
              placeholder="Contenido HTML"
              rows={6}
              className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs outline-none focus:border-brand"
            />
            <div className="rounded-md border border-border bg-white p-3 text-black">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-neutral-400">
                Preview
              </p>
              <div
                className="prose-sm text-sm"
                dangerouslySetInnerHTML={{ __html: form.contenido_html }}
              />
            </div>

            <textarea
              value={form.contenido_texto}
              onChange={(e) =>
                setForm({ ...form, contenido_texto: e.target.value })
              }
              placeholder="Versión texto plano (obligatoria)"
              required
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-xs outline-none focus:border-brand"
            />

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.es_transaccional}
                  onChange={(e) =>
                    setForm({ ...form, es_transaccional: e.target.checked })
                  }
                />
                Transaccional
              </label>
              <select
                value={form.area_relacionada ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    area_relacionada: e.target.value || null,
                  })
                }
                className="rounded-md border border-border bg-surface-2 px-2 py-1 text-sm outline-none focus:border-brand"
              >
                <option value="">Sin área</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {variables.length > 0 && (
              <p className="text-xs text-muted">
                Variables detectadas: {variables.join(", ")}
              </p>
            )}
            {mensaje && <p className="text-xs text-brand">{mensaje}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar plantilla"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
