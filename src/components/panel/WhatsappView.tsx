"use client";

import { useState, useTransition } from "react";
import {
  crearPlantillaWhatsapp,
  enviarCampanaWhatsapp,
} from "@/app/panel/comunicaciones/whatsapp/actions";

type Categoria = "marketing" | "utilidad" | "autenticacion";
type EstadoMeta = "pendiente" | "aprobada" | "rechazada";

export interface PlantillaWa {
  id: string;
  nombre: string;
  categoria: Categoria;
  estado_aprobacion_meta: EstadoMeta;
  disparar_flujo_lucy: boolean;
}
export interface CampanaWa {
  id: string;
  nombre: string;
  estado: string;
  fecha_enviada: string | null;
  plantilla_nombre: string | null;
}
export interface AudienciaOpt {
  id: string;
  nombre: string;
}

const META_STYLE: Record<EstadoMeta, string> = {
  aprobada: "border-ok/50 bg-ok/10 text-ok",
  pendiente: "border-warn/50 bg-warn/10 text-warn",
  rechazada: "border-danger/50 bg-danger/10 text-danger",
};

export function WhatsappView({
  configurado,
  puedeEditar,
  plantillas,
  campanas,
  audiencias,
}: {
  configurado: boolean;
  puedeEditar: boolean;
  plantillas: PlantillaWa[];
  campanas: CampanaWa[];
  audiencias: AudienciaOpt[];
}) {
  const aprobadas = plantillas.filter(
    (p) => p.estado_aprobacion_meta === "aprobada",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted">
          Broadcast por WhatsApp Business (Meta). Solo con plantillas aprobadas
          por Meta — no se puede enviar texto libre.
        </p>
      </div>

      {!configurado && (
        <div className="rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
          WhatsApp no está configurado (faltan <code>WHATSAPP_TOKEN</code> y{" "}
          <code>WHATSAPP_PHONE_ID</code>). Podés gestionar plantillas, pero el
          envío está deshabilitado.
        </div>
      )}

      {puedeEditar && (
        <ConstructorCampana
          configurado={configurado}
          aprobadas={aprobadas}
          audiencias={audiencias}
        />
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Plantillas</h2>
        {puedeEditar && <NuevaPlantilla />}
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Categoría</th>
                <th className="p-3 font-medium">Estado Meta</th>
                <th className="p-3 font-medium">Flujo Lucy</th>
              </tr>
            </thead>
            <tbody>
              {plantillas.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted">
                    Sin plantillas.
                  </td>
                </tr>
              )}
              {plantillas.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">{p.nombre}</td>
                  <td className="p-3 capitalize text-muted">{p.categoria}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${META_STYLE[p.estado_aprobacion_meta]}`}
                    >
                      {p.estado_aprobacion_meta}
                    </span>
                  </td>
                  <td className="p-3 text-muted">
                    {p.disparar_flujo_lucy ? "Sí" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Campañas enviadas</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="p-3 font-medium">Campaña</th>
                <th className="p-3 font-medium">Plantilla</th>
                <th className="p-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {campanas.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted">
                    Aún no hay campañas.
                  </td>
                </tr>
              )}
              {campanas.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="p-3 font-medium">{c.nombre}</td>
                  <td className="p-3 text-muted">
                    {c.plantilla_nombre ?? "—"}
                  </td>
                  <td className="p-3 capitalize text-muted">{c.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ConstructorCampana({
  configurado,
  aprobadas,
  audiencias,
}: {
  configurado: boolean;
  aprobadas: PlantillaWa[];
  audiencias: AudienciaOpt[];
}) {
  const [nombre, setNombre] = useState("");
  const [plantillaId, setPlantillaId] = useState("");
  const [audienciaId, setAudienciaId] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  const puedeEnviar =
    configurado && plantillaId && audienciaId && nombre.trim().length > 1;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    startTransition(async () => {
      const r = await enviarCampanaWhatsapp({
        nombre,
        plantillaId,
        audienciaId,
      });
      setMsg(
        r.ok
          ? `Enviados: ${r.enviados ?? 0} · errores: ${r.errores ?? 0}`
          : (r.mensaje ?? "No se pudo enviar."),
      );
      if (r.ok) {
        setNombre("");
        setPlantillaId("");
        setAudienciaId("");
      }
    });
  }

  return (
    <form
      onSubmit={enviar}
      className="space-y-3 rounded-xl border border-brand/30 bg-brand-soft/10 p-4"
    >
      <p className="text-sm font-semibold">Nueva campaña de broadcast</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la campaña"
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={plantillaId}
          onChange={(e) => setPlantillaId(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Plantilla aprobada…</option>
          {aprobadas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <select
          value={audienciaId}
          onChange={(e) => setAudienciaId(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Audiencia…</option>
          {audiencias.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </div>
      {aprobadas.length === 0 && (
        <p className="text-xs text-muted">
          No hay plantillas aprobadas por Meta todavía — no se puede enviar
          hasta tener al menos una.
        </p>
      )}
      {msg && <p className="text-sm text-brand">{msg}</p>}
      <button
        type="submit"
        disabled={!puedeEnviar || pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviar broadcast"}
      </button>
    </form>
  );
}

function NuevaPlantilla() {
  const [abrir, setAbrir] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("marketing");
  const [texto, setTexto] = useState("");
  const [lucy, setLucy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    startTransition(async () => {
      const r = await crearPlantillaWhatsapp({
        nombre,
        categoria,
        texto_aprobado: texto,
        disparar_flujo_lucy: lucy,
      });
      setMsg(r.ok ? "" : (r.mensaje ?? "Error"));
      if (r.ok) {
        setNombre("");
        setTexto("");
        setLucy(false);
        setAbrir(false);
      }
    });
  }

  if (!abrir) {
    return (
      <button
        onClick={() => setAbrir(true)}
        className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
      >
        + Nueva plantilla
      </button>
    );
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la plantilla"
          required
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as Categoria)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
        >
          <option value="marketing">Marketing</option>
          <option value="utilidad">Utilidad</option>
          <option value="autenticacion">Autenticación</option>
        </select>
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Texto de la plantilla (se envía a Meta para aprobación). Variables: {{1}}, {{2}}…"
        rows={3}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={lucy}
          onChange={(e) => setLucy(e.target.checked)}
        />
        Avisar a n8n para que el flujo de Lucy escuche a estos contactos tras el
        envío
      </label>
      <p className="text-xs text-muted">
        La plantilla queda en estado <b>pendiente</b>: Meta la aprueba (o
        rechaza) — la aprobación no se hace desde acá, solo se refleja el
        estado.
      </p>
      {msg && <p className="text-sm text-warn">{msg}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Crear plantilla"}
        </button>
        <button
          type="button"
          onClick={() => setAbrir(false)}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
