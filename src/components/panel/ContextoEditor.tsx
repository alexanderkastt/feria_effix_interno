"use client";

import { useState, useTransition } from "react";
import { guardarContexto } from "@/app/panel/contexto/actions";

export interface ContextoRow {
  fecha_inicio: string | null;
  fecha_fin: string | null;
  ubicacion: string | null;
  meta_asistencia: number | null;
  precio_boleta: number | null;
  google_ads_id: string | null;
  ga4_id: string | null;
  gtm_id: string | null;
  meta_pixel_id: string | null;
  notas: string | null;
}

const nn = (v: string) => (v.trim() === "" ? null : v.trim());
const numOrNull = (v: string) => {
  const n = Number(v);
  return v.trim() === "" || !Number.isFinite(n) ? null : n;
};

export function ContextoEditor({ contexto }: { contexto: ContextoRow | null }) {
  const c = contexto ?? ({} as ContextoRow);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    startTransition(async () => {
      const r = await guardarContexto({
        fecha_inicio: nn(String(fd.get("fecha_inicio") ?? "")),
        fecha_fin: nn(String(fd.get("fecha_fin") ?? "")),
        ubicacion: nn(String(fd.get("ubicacion") ?? "")),
        meta_asistencia: numOrNull(String(fd.get("meta_asistencia") ?? "")),
        precio_boleta: numOrNull(String(fd.get("precio_boleta") ?? "")),
        google_ads_id: nn(String(fd.get("google_ads_id") ?? "")),
        ga4_id: nn(String(fd.get("ga4_id") ?? "")),
        gtm_id: nn(String(fd.get("gtm_id") ?? "")),
        meta_pixel_id: nn(String(fd.get("meta_pixel_id") ?? "")),
        notas: nn(String(fd.get("notas") ?? "")),
      });
      setMsg({
        ok: r.ok,
        texto: r.ok ? "Contexto guardado." : (r.mensaje ?? "Error al guardar."),
      });
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Contexto del evento
        </h1>
        <p className="text-sm text-muted">
          Datos estructurales de Feria Effix 2026. Cualquier módulo los consulta
          de acá — dejá de buscarlos en documentos sueltos.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-6 rounded-xl border border-border bg-surface p-6"
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted">
            Fechas, sede y metas
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              name="fecha_inicio"
              label="Fecha inicio"
              type="date"
              def={c.fecha_inicio}
            />
            <Campo
              name="fecha_fin"
              label="Fecha fin"
              type="date"
              def={c.fecha_fin}
            />
            <Campo name="ubicacion" label="Ubicación" def={c.ubicacion} />
            <Campo
              name="meta_asistencia"
              label="Meta de asistencia"
              type="number"
              def={c.meta_asistencia}
            />
            <Campo
              name="precio_boleta"
              label="Precio boleta (COP)"
              type="number"
              def={c.precio_boleta}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-muted">
            IDs de tracking
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              name="google_ads_id"
              label="Google Ads ID"
              def={c.google_ads_id}
            />
            <Campo name="ga4_id" label="GA4 ID" def={c.ga4_id} />
            <Campo name="gtm_id" label="GTM ID" def={c.gtm_id} />
            <Campo
              name="meta_pixel_id"
              label="Pixel de Meta"
              def={c.meta_pixel_id}
            />
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="notas" className="text-sm font-medium">
            Notas
          </label>
          <textarea
            id="notas"
            name="notas"
            rows={3}
            defaultValue={c.notas ?? ""}
            className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>

        {msg && (
          <p
            className={`rounded-md border px-3 py-2 text-sm ${
              msg.ok
                ? "border-ok/40 bg-ok/10 text-ok"
                : "border-warn/40 bg-warn/10 text-warn"
            }`}
          >
            {msg.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar contexto"}
        </button>
      </form>
    </div>
  );
}

function Campo({
  name,
  label,
  type = "text",
  def,
}: {
  name: string;
  label: string;
  type?: string;
  def: string | number | null;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={def ?? ""}
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}
