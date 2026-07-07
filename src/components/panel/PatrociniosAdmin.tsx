"use client";

import { useState, useTransition } from "react";
import {
  crearPatrocinio,
  cambiarEstadoPago,
} from "@/app/panel/patrocinios/actions";

type Tier = "black" | "platino" | "diamante" | "oro" | "plata" | "bronce";
type EstadoPago = "pendiente" | "parcial" | "pagado";

export interface PatrocinioView {
  id: string;
  empresa: string;
  tier: Tier | null;
  monto: number;
  estado_pago: EstadoPago;
  entregables_pendientes: string | null;
  stand_codigo: string | null;
}

const TIERS: Tier[] = [
  "black",
  "platino",
  "diamante",
  "oro",
  "plata",
  "bronce",
];
const ESTADOS: EstadoPago[] = ["pendiente", "parcial", "pagado"];

const TIER_STYLE: Record<Tier, string> = {
  black: "border-foreground/50 bg-foreground/10 text-foreground",
  platino: "border-brand/50 bg-brand-soft/30 text-brand",
  diamante: "border-brand/40 bg-brand-soft/20 text-brand",
  oro: "border-warn/50 bg-warn/10 text-warn",
  plata: "border-muted/40 bg-surface-2 text-muted",
  bronce: "border-border bg-surface-2 text-muted",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function PatrociniosAdmin({
  patrocinios,
  puedeEditar,
}: {
  patrocinios: PatrocinioView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);
  const [pending, startTransition] = useTransition();

  const facturado = patrocinios
    .filter((p) => p.estado_pago === "pagado")
    .reduce((s, p) => s + Number(p.monto), 0);
  const comprometido = patrocinios.reduce((s, p) => s + Number(p.monto), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patrocinios</h1>
          <p className="text-sm text-muted">
            Marcas, tiers y estado de pago.{!puedeEditar && " Solo lectura."}
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setAbrir((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            {abrir ? "Cerrar" : "+ Nuevo patrocinio"}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Facturado (pagado)</p>
          <p className="mt-1 text-2xl font-bold text-ok">{fmtCOP(facturado)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Comprometido (total)</p>
          <p className="mt-1 text-2xl font-bold text-brand">
            {fmtCOP(comprometido)}
          </p>
        </div>
      </div>

      {abrir && puedeEditar && (
        <NuevoPatrocinioForm onCreado={() => setAbrir(false)} />
      )}

      <div
        className={`overflow-x-auto rounded-xl border border-border bg-surface ${pending ? "opacity-70" : ""}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Empresa</th>
              <th className="p-3 font-medium">Tier</th>
              <th className="p-3 font-medium">Monto</th>
              <th className="p-3 font-medium">Estado pago</th>
              <th className="p-3 font-medium">Stand</th>
              <th className="p-3 font-medium">Entregables</th>
            </tr>
          </thead>
          <tbody>
            {patrocinios.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Aún no hay patrocinios.
                </td>
              </tr>
            )}
            {patrocinios.map((p) => (
              <tr key={p.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{p.empresa}</td>
                <td className="p-3">
                  {p.tier && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs capitalize ${TIER_STYLE[p.tier]}`}
                    >
                      {p.tier}
                    </span>
                  )}
                </td>
                <td className="p-3">{fmtCOP(Number(p.monto))}</td>
                <td className="p-3">
                  {puedeEditar ? (
                    <select
                      value={p.estado_pago}
                      disabled={pending}
                      onChange={(e) => {
                        const nuevo = e.target.value as EstadoPago;
                        startTransition(async () => {
                          await cambiarEstadoPago(p.id, nuevo);
                        });
                      }}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs capitalize outline-none focus:border-brand"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="capitalize">{p.estado_pago}</span>
                  )}
                </td>
                <td className="p-3 text-muted">{p.stand_codigo ?? "—"}</td>
                <td className="p-3 text-muted">
                  {p.entregables_pendientes ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NuevoPatrocinioForm({ onCreado }: { onCreado: () => void }) {
  const [empresa, setEmpresa] = useState("");
  const [tier, setTier] = useState<Tier>("oro");
  const [monto, setMonto] = useState("");
  const [entregables, setEntregables] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (empresa.trim().length < 2) return;
    startTransition(async () => {
      const r = await crearPatrocinio({
        empresa,
        tier,
        monto: Number(monto) || 0,
        entregables,
      });
      if (r.ok) {
        setEmpresa("");
        setMonto("");
        setEntregables("");
        setTier("oro");
        onCreado();
      }
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
    >
      <input
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        placeholder="Empresa"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={tier}
        onChange={(e) => setTier(e.target.value as Tier)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        {TIERS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto (COP)"
        type="number"
        min="0"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={entregables}
        onChange={(e) => setEntregables(e.target.value)}
        placeholder="Entregables pendientes"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Guardando…" : "Crear patrocinio"}
      </button>
    </form>
  );
}
