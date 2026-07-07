"use client";

import { useState, useTransition } from "react";
import {
  crearAudienciaDinamica,
  crearAudienciaManual,
  contarAudienciaDinamica,
  quitarContactoDeAudiencia,
  type FiltroAudiencia,
} from "@/app/panel/comunicaciones/audiencias/actions";

interface Miembro {
  id: string;
  nombre: string | null;
  email: string | null;
  consentimiento_marketing: boolean;
}

export interface AudienciaVista {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "manual" | "dinamica";
  filtro: FiltroAudiencia | null;
  total: number;
  conConsentimiento: number;
  miembros: Miembro[];
}

const TIPOS_CONTACTO = [
  { v: "comprador_boleta", l: "Comprador de boleta" },
  { v: "postulante_ponente", l: "Postulante ponente" },
  { v: "cliente_stand", l: "Cliente de stand" },
  { v: "patrocinador", l: "Patrocinador" },
  { v: "aliado", l: "Aliado" },
  { v: "comunidad", l: "Comunidad" },
  { v: "embajador", l: "Embajador" },
  { v: "otro", l: "Otro" },
];

export function AudienciasView({
  audiencias,
  puedeEditar,
}: {
  audiencias: AudienciaVista[];
  puedeEditar: boolean;
}) {
  const [modo, setModo] = useState<null | "dinamica" | "manual">(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audiencias</h1>
          <p className="text-sm text-muted">
            Segmentos de contactos para campañas. Los que no tienen
            consentimiento se excluyen del envío.
          </p>
        </div>
        {puedeEditar && (
          <div className="flex gap-2">
            <button
              onClick={() => setModo(modo === "dinamica" ? null : "dinamica")}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              + Dinámica
            </button>
            <button
              onClick={() => setModo(modo === "manual" ? null : "manual")}
              className="rounded-md border border-border px-3 py-2 text-sm hover:border-brand/50"
            >
              + Manual
            </button>
          </div>
        )}
      </div>

      {modo === "dinamica" && <FormDinamica onListo={() => setModo(null)} />}
      {modo === "manual" && <FormManual onListo={() => setModo(null)} />}

      <div className="space-y-3">
        {audiencias.length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Aún no hay audiencias.
          </p>
        )}
        {audiencias.map((a) => {
          const sinConsent = a.total - a.conConsentimiento;
          const open = abierta === a.id;
          return (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-surface"
            >
              <button
                onClick={() => setAbierta(open ? null : a.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.nombre}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        a.tipo === "dinamica"
                          ? "border-brand/40 bg-brand-soft/30 text-brand"
                          : "border-border bg-surface-2 text-muted"
                      }`}
                    >
                      {a.tipo}
                    </span>
                  </div>
                  {a.descripcion && (
                    <p className="mt-1 text-xs text-muted">{a.descripcion}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p>
                    <span className="font-semibold text-brand">
                      {a.conConsentimiento}
                    </span>{" "}
                    <span className="text-muted">/ {a.total} elegibles</span>
                  </p>
                  {sinConsent > 0 && (
                    <p className="text-xs text-warn">
                      {sinConsent} sin consentimiento
                    </p>
                  )}
                </div>
              </button>

              {open && (
                <div className="border-t border-border/60 p-4">
                  {a.miembros.length === 0 ? (
                    <p className="text-sm text-muted">Sin contactos.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {a.miembros.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2 border-b border-border/40 py-1"
                        >
                          <span>
                            {m.nombre ?? "—"}{" "}
                            <span className="text-muted">{m.email}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            {m.consentimiento_marketing ? (
                              <span className="text-xs text-ok">
                                consentido
                              </span>
                            ) : (
                              <span className="text-xs text-warn">
                                sin consentimiento
                              </span>
                            )}
                            {puedeEditar && a.tipo === "manual" && (
                              <QuitarBtn audienciaId={a.id} contactoId={m.id} />
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QuitarBtn({
  audienciaId,
  contactoId,
}: {
  audienciaId: string;
  contactoId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await quitarContactoDeAudiencia(audienciaId, contactoId);
        })
      }
      className="text-xs text-danger hover:underline disabled:opacity-50"
    >
      quitar
    </button>
  );
}

function FormDinamica({ onListo }: { onListo: () => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("");
  const [tag, setTag] = useState("");
  const [pais, setPais] = useState("");
  const [preview, setPreview] = useState<{
    total: number;
    conConsentimiento: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();
  const [guardando, startGuardar] = useTransition();

  function filtro(): FiltroAudiencia {
    return {
      tipo_contacto: tipo || undefined,
      tag: tag || undefined,
      pais: pais || undefined,
    };
  }

  function actualizarPreview() {
    startTransition(async () => {
      setPreview(await contarAudienciaDinamica(filtro()));
    });
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) return;
    startGuardar(async () => {
      const r = await crearAudienciaDinamica(nombre, descripcion, filtro());
      if (r.ok) onListo();
    });
  }

  return (
    <form
      onSubmit={guardar}
      className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/10 p-4"
    >
      <p className="text-sm font-semibold">
        Audiencia dinámica (se recalcula sola)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la audiencia"
          required
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <select
          value={tipo}
          onChange={(e) => {
            setTipo(e.target.value);
          }}
          onBlur={actualizarPreview}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Cualquier tipo</option>
          {TIPOS_CONTACTO.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </select>
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onBlur={actualizarPreview}
          placeholder="Tag (opcional)"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          onBlur={actualizarPreview}
          placeholder="País (opcional)"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={actualizarPreview}
          disabled={pending}
          className="text-sm text-brand hover:underline disabled:opacity-50"
        >
          {pending ? "Calculando…" : "Ver a cuántos alcanza"}
        </button>
        {preview && (
          <p className="text-sm">
            <span className="font-semibold text-brand">
              {preview.conConsentimiento}
            </span>{" "}
            <span className="text-muted">
              elegibles de {preview.total} contactos
            </span>
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Crear audiencia dinámica"}
      </button>
    </form>
  );
}

function FormManual({ onListo }: { onListo: () => void }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) return;
    startTransition(async () => {
      const r = await crearAudienciaManual(nombre, descripcion);
      if (r.ok) onListo();
    });
  }

  return (
    <form
      onSubmit={guardar}
      className="space-y-3 rounded-xl border border-border bg-surface p-4"
    >
      <p className="text-sm font-semibold">Audiencia manual</p>
      <p className="text-xs text-muted">
        Los contactos se agregan desde la vista de Contactos.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la audiencia"
          required
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción (opcional)"
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Crear audiencia manual"}
      </button>
    </form>
  );
}
