"use client";

import { useTransition } from "react";
import {
  cambiarEstadoStand,
  vincularPatrocinador,
} from "@/app/panel/stands/actions";

export interface StandView {
  id: string;
  codigo: string;
  nombre: string | null;
  tamano: string | null;
  precio: number;
  estado: "disponible" | "bloqueado_temporal" | "reservado" | "vendido";
  cliente_nombre: string | null;
  patrocinador_id: string | null;
}

export interface PatrocinioOption {
  id: string;
  empresa: string;
}

const ESTADOS: StandView["estado"][] = [
  "disponible",
  "bloqueado_temporal",
  "reservado",
  "vendido",
];

const ESTADO_LABEL: Record<StandView["estado"], string> = {
  disponible: "Disponible",
  bloqueado_temporal: "Bloqueado",
  reservado: "Reservado",
  vendido: "Vendido",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function StandsAdmin({
  stands,
  patrocinios,
  puedeEditar,
}: {
  stands: StandView[];
  patrocinios: PatrocinioOption[];
  puedeEditar: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const conteo = ESTADOS.map((e) => ({
    estado: e,
    n: stands.filter((s) => s.estado === e).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stands</h1>
        <p className="text-sm text-muted">
          Plano interno · gestión de estados y vínculo con patrocinadores.
          {!puedeEditar && " Solo lectura."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {conteo.map((c) => (
          <div
            key={c.estado}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted">{ESTADO_LABEL[c.estado]}</p>
            <p className="mt-1 text-2xl font-bold text-brand">{c.n}</p>
          </div>
        ))}
      </div>

      <div
        className={`overflow-x-auto rounded-xl border border-border bg-surface ${pending ? "opacity-70" : ""}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Código</th>
              <th className="p-3 font-medium">Ubicación</th>
              <th className="p-3 font-medium">Tamaño</th>
              <th className="p-3 font-medium">Precio</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Patrocinador</th>
            </tr>
          </thead>
          <tbody>
            {stands.map((s) => (
              <tr key={s.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{s.codigo}</td>
                <td className="p-3 text-muted">{s.nombre ?? "—"}</td>
                <td className="p-3 text-muted">{s.tamano ?? "—"}</td>
                <td className="p-3">{fmtCOP(s.precio)}</td>
                <td className="p-3">
                  {puedeEditar ? (
                    <select
                      value={s.estado}
                      disabled={pending}
                      onChange={(e) => {
                        const nuevo = e.target.value as StandView["estado"];
                        startTransition(async () => {
                          await cambiarEstadoStand(s.id, nuevo);
                        });
                      }}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {ESTADO_LABEL[e]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    ESTADO_LABEL[s.estado]
                  )}
                </td>
                <td className="p-3 text-muted">{s.cliente_nombre ?? "—"}</td>
                <td className="p-3">
                  {puedeEditar ? (
                    <select
                      value={s.patrocinador_id ?? ""}
                      disabled={pending}
                      onChange={(e) => {
                        const pid = e.target.value || null;
                        startTransition(async () => {
                          await vincularPatrocinador(s.id, pid);
                        });
                      }}
                      className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                    >
                      <option value="">— Sin patrocinador —</option>
                      {patrocinios.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.empresa}
                        </option>
                      ))}
                    </select>
                  ) : (
                    (patrocinios.find((p) => p.id === s.patrocinador_id)
                      ?.empresa ?? "—")
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
