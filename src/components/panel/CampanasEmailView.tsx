"use client";

import { useState, useTransition } from "react";
import {
  crearCampana,
  enviarPruebaCampana,
  enviarCampanaReal,
} from "@/app/panel/comunicaciones/campanas/actions";

export interface CampanaRow {
  id: string;
  nombre: string;
  estado: string;
  prueba_enviada: boolean;
  plantilla_id: string | null;
  audiencia_id: string | null;
  plantilla_nombre: string | null;
  audiencia_nombre: string | null;
}
export interface AudienciaStat {
  id: string;
  nombre: string;
  total: number;
  conConsentimiento: number;
}
export interface StatsEnvio {
  enviado: number;
  entregado: number;
  abierto: number;
  click: number;
  rebotado: number;
  desuscrito: number;
}

export function CampanasEmailView({
  campanas,
  plantillas,
  audiencias,
  stats,
  puedeEditar,
  resendListo,
}: {
  campanas: CampanaRow[];
  plantillas: { id: string; nombre: string }[];
  audiencias: AudienciaStat[];
  stats: Record<string, StatsEnvio>;
  puedeEditar: boolean;
  resendListo: boolean;
}) {
  const [nombre, setNombre] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [audienciaId, setAudienciaId] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const audSel = audiencias.find((a) => a.id === audienciaId);

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    startTransition(async () => {
      const r = await crearCampana({
        nombre,
        plantilla_id: plantillaId,
        audiencia_id: audienciaId,
      });
      if (r.ok) {
        setNombre("");
        setPlantillaId("");
        setAudienciaId("");
      } else setMsg(r.mensaje ?? "Error");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Campañas de email</h1>
        <p className="text-sm text-muted">
          Los contactos sin consentimiento se excluyen automáticamente del
          envío.
        </p>
      </div>

      {!resendListo && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
          Resend no está configurado (falta <code>RESEND_API_KEY</code>). Podés
          armar campañas, pero el envío queda deshabilitado hasta cargar la key.
        </div>
      )}

      {/* Constructor */}
      {puedeEditar && (
        <form
          onSubmit={crear}
          className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3"
        >
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la campaña"
            required
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            required
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Plantilla…</option>
            {plantillas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
          <select
            value={audienciaId}
            onChange={(e) => setAudienciaId(e.target.value)}
            required
            className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Audiencia…</option>
            {audiencias.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
          {audSel && (
            <p className="text-xs text-muted sm:col-span-3">
              Esta audiencia tiene <strong>{audSel.total}</strong> contactos ·{" "}
              <strong className="text-brand">{audSel.conConsentimiento}</strong>{" "}
              recibirán (con consentimiento) ·{" "}
              <span className="text-warn">
                {audSel.total - audSel.conConsentimiento} excluidos
              </span>
            </p>
          )}
          {msg && <p className="text-xs text-warn sm:col-span-3">{msg}</p>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-3"
          >
            Crear campaña (borrador)
          </button>
        </form>
      )}

      {/* Lista de campañas */}
      <div className="space-y-3">
        {campanas.map((c) => (
          <CampanaCard
            key={c.id}
            c={c}
            stats={stats[c.id]}
            puedeEditar={puedeEditar}
            resendListo={resendListo}
          />
        ))}
        {campanas.length === 0 && (
          <p className="text-sm text-muted">Aún no hay campañas.</p>
        )}
      </div>
    </div>
  );
}

function CampanaCard({
  c,
  stats,
  puedeEditar,
  resendListo,
}: {
  c: CampanaRow;
  stats?: StatsEnvio;
  puedeEditar: boolean;
  resendListo: boolean;
}) {
  const [emailPrueba, setEmailPrueba] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function prueba() {
    setMsg("");
    startTransition(async () => {
      const r = await enviarPruebaCampana(c.id, emailPrueba);
      setMsg(
        r.ok
          ? "Prueba enviada ✓ — ya podés enviar real."
          : (r.mensaje ?? "Error"),
      );
    });
  }
  function enviarReal() {
    setMsg("");
    startTransition(async () => {
      const r = await enviarCampanaReal(c.id);
      setMsg(
        r.ok
          ? `Enviados: ${r.enviados} · Excluidos sin consentimiento: ${r.excluidosSinConsentimiento} · Errores: ${r.errores}`
          : (r.mensaje ?? "Error"),
      );
    });
  }

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{c.nombre}</p>
          <p className="text-xs text-muted">
            {c.plantilla_nombre ?? "sin plantilla"} →{" "}
            {c.audiencia_nombre ?? "sin audiencia"}
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted">
          {c.estado}
        </span>
      </div>

      {stats && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
          <span>Enviados: {stats.enviado}</span>
          <span>Entregados: {stats.entregado}</span>
          <span>Aperturas: {stats.abierto}</span>
          <span>Clicks: {stats.click}</span>
          <span className="text-warn">Rebotes: {stats.rebotado}</span>
          <span className="text-warn">Bajas: {stats.desuscrito}</span>
        </div>
      )}

      {puedeEditar && c.estado !== "enviada" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border/60 pt-3">
          <div className="space-y-1">
            <label className="text-xs text-muted">Correo de prueba</label>
            <input
              value={emailPrueba}
              onChange={(e) => setEmailPrueba(e.target.value)}
              placeholder="interno@feriaeffix.com"
              className="rounded-md border border-border bg-surface-2 px-2 py-1 text-sm outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={prueba}
            disabled={pending || !resendListo}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-brand/50 disabled:opacity-50"
          >
            Enviar prueba
          </button>
          <button
            onClick={enviarReal}
            disabled={pending || !resendListo || !c.prueba_enviada}
            title={
              !c.prueba_enviada
                ? "Enviá una prueba antes de habilitar el envío real"
                : ""
            }
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
          >
            Enviar real
          </button>
        </div>
      )}
      {msg && <p className="mt-2 text-xs text-brand">{msg}</p>}
    </article>
  );
}
