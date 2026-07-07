"use client";

import { useState } from "react";
import {
  crearIniciativa,
  moverEtapaMarketing,
  type EtapaMarketing,
  type CanalMarketing,
} from "@/app/panel/marketing/actions";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface IniciativaView {
  id: string;
  titulo: string;
  canal: CanalMarketing;
  etapa: EtapaMarketing;
  presupuesto_asignado: number | null;
  resultado_principal: string | null;
}

const ETAPAS = [
  { key: "idea", label: "Idea" },
  { key: "en_diseno", label: "En diseño" },
  { key: "programado", label: "Programado" },
  { key: "activo", label: "Activo" },
  { key: "finalizado", label: "Finalizado" },
  { key: "analizado", label: "Analizado" },
];

const CANALES: CanalMarketing[] = [
  "meta_ads",
  "google_ads",
  "organico_instagram",
  "organico_tiktok",
  "email",
  "whatsapp",
  "influencers",
  "otro",
];

const CANAL_LABEL: Record<CanalMarketing, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  organico_instagram: "IG orgánico",
  organico_tiktok: "TikTok orgánico",
  email: "Email",
  whatsapp: "WhatsApp",
  influencers: "Influencers",
  otro: "Otro",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const COLS: ColumnaTabla<IniciativaView>[] = [
  { label: "Título", get: (i) => i.titulo },
  { label: "Canal", get: (i) => CANAL_LABEL[i.canal] },
  {
    label: "Presupuesto",
    get: (i) =>
      i.presupuesto_asignado ? fmtCOP(Number(i.presupuesto_asignado)) : "—",
  },
  { label: "Resultado principal", get: (i) => i.resultado_principal ?? "—" },
];

export function PipelineMarketing({
  iniciativas,
  puedeEditar,
}: {
  iniciativas: IniciativaView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing</h1>
          <p className="text-sm text-muted">
            Iniciativas por canal.
            {!puedeEditar && " Solo lectura."}
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setAbrir((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            {abrir ? "Cerrar" : "+ Nueva iniciativa"}
          </button>
        )}
      </div>

      {abrir && puedeEditar && (
        <NuevaIniciativaForm onCreado={() => setAbrir(false)} />
      )}

      <TableroConVistas<IniciativaView>
        items={iniciativas}
        getId={(i) => i.id}
        campoEtapa="etapa"
        etapas={ETAPAS}
        columnas={COLS}
        onMover={(id, etapa) =>
          moverEtapaMarketing(id, etapa as EtapaMarketing)
        }
        puedeEditar={puedeEditar}
        renderCard={(i) => (
          <>
            <p className="text-sm font-medium leading-snug">{i.titulo}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-brand">
                {CANAL_LABEL[i.canal]}
              </span>
              {i.presupuesto_asignado ? (
                <span className="text-muted">
                  {fmtCOP(Number(i.presupuesto_asignado))}
                </span>
              ) : null}
            </div>
            {i.resultado_principal && (
              <p className="mt-2 text-xs text-ok">{i.resultado_principal}</p>
            )}
          </>
        )}
      />
    </div>
  );
}

function NuevaIniciativaForm({ onCreado }: { onCreado: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [canal, setCanal] = useState<CanalMarketing>("meta_ads");
  const [presupuesto, setPresupuesto] = useState("");
  const [pending, setPending] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (titulo.trim().length < 2) return;
    setPending(true);
    const r = await crearIniciativa({
      titulo,
      canal,
      presupuesto_asignado: Number(presupuesto) || 0,
    });
    setPending(false);
    if (r.ok) {
      setTitulo("");
      setPresupuesto("");
      setCanal("meta_ads");
      onCreado();
    }
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3"
    >
      <input
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Título de la iniciativa"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={canal}
        onChange={(e) => setCanal(e.target.value as CanalMarketing)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {CANALES.map((c) => (
          <option key={c} value={c}>
            {CANAL_LABEL[c]}
          </option>
        ))}
      </select>
      <input
        value={presupuesto}
        onChange={(e) => setPresupuesto(e.target.value)}
        placeholder="Presupuesto (COP)"
        type="number"
        min="0"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-3"
      >
        {pending ? "Guardando…" : "Crear iniciativa"}
      </button>
    </form>
  );
}
