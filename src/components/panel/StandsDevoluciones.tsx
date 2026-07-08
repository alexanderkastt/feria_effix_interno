"use client";

import { useMemo, useState } from "react";
import { StandAvatar } from "@/components/StandAvatar";
import {
  ESTADO_STANDS_LABEL,
  ESTADO_VENTA_LABEL,
  ESTADO_VENTA_STYLE,
  PABELLON_LABEL,
  fmtCOP,
  type Pabellon,
  type StandView,
} from "@/components/panel/stands-shared";

export type EstadoDevolucion =
  | "ok"
  | "pendiente_certificacion_bancaria"
  | "pendiente_documento_liquidacion"
  | "saldo_a_favor";

export interface DevolucionView {
  id: string;
  stand_id: string | null;
  pabellon: Pabellon | null;
  codigo: string | null;
  valor_pagado_hasta_devolucion: number | null;
  estado_devolucion: EstadoDevolucion | null;
  motivo: string | null;
  observaciones: string | null;
  fecha_devolucion: string | null;
}

const ESTADO_DEVOLUCION_LABEL: Record<EstadoDevolucion, string> = {
  ok: "Ok",
  pendiente_certificacion_bancaria: "Pendiente certificación bancaria",
  pendiente_documento_liquidacion: "Pendiente documento de liquidación",
  saldo_a_favor: "Saldo a favor",
};

const ESTADO_DEVOLUCION_STYLE: Record<EstadoDevolucion, string> = {
  ok: "border-ok/50 bg-ok/10 text-ok",
  pendiente_certificacion_bancaria: "border-warn/50 bg-warn/10 text-warn",
  pendiente_documento_liquidacion: "border-warn/50 bg-warn/10 text-warn",
  saldo_a_favor: "border-brand bg-brand-soft/50 text-white font-semibold",
};

const FILTROS: (EstadoDevolucion | "todos")[] = [
  "todos",
  "saldo_a_favor",
  "pendiente_certificacion_bancaria",
  "pendiente_documento_liquidacion",
  "ok",
];

export function StandsDevoluciones({
  devoluciones,
  stands,
  onVerStand,
}: {
  devoluciones: DevolucionView[];
  stands: StandView[];
  onVerStand: (stand: StandView) => void;
}) {
  const [filtro, setFiltro] = useState<EstadoDevolucion | "todos">("todos");

  const standsPorId = useMemo(() => {
    const mapa = new Map<string, StandView>();
    for (const s of stands) mapa.set(s.id, s);
    return mapa;
  }, [stands]);

  const visibles = devoluciones.filter(
    (d) => filtro === "todos" || d.estado_devolucion === filtro,
  );
  const saldoAFavor = devoluciones.filter(
    (d) => d.estado_devolucion === "saldo_a_favor",
  );

  return (
    <div className="space-y-4">
      {saldoAFavor.length > 0 && (
        <div className="rounded-xl border-2 border-brand bg-brand-soft/20 p-4">
          <p className="text-sm font-semibold text-brand">
            {saldoAFavor.length} devolución
            {saldoAFavor.length === 1 ? "" : "es"} con saldo a favor pendiente
            de aplicar en la próxima edición — no perder de vista.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filtro === f
                ? "border-brand bg-brand-soft/30 text-brand"
                : "border-border text-muted hover:border-brand"
            }`}
          >
            {f === "todos" ? "Todos" : ESTADO_DEVOLUCION_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Código</th>
              <th className="p-3 font-medium">Nombre comercial</th>
              <th className="p-3 font-medium">Cliente</th>
              <th className="p-3 font-medium">Ciudad</th>
              <th className="p-3 font-medium">Pabellón</th>
              <th className="p-3 font-medium">Tamaño</th>
              <th className="p-3 font-medium">Precio</th>
              <th className="p-3 font-medium">Estado</th>
              <th className="p-3 font-medium">Estado venta</th>
              <th className="p-3 font-medium">Asesor</th>
              <th className="p-3 font-medium">Valor pagado</th>
              <th className="p-3 font-medium">Estado devolución</th>
              <th className="p-3 font-medium">Motivo</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Observaciones</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={16} className="p-6 text-center text-muted">
                  Sin devoluciones para este filtro.
                </td>
              </tr>
            )}
            {visibles.map((d) => {
              const stand = d.stand_id ? standsPorId.get(d.stand_id) : null;
              const pabellon = stand?.pabellon ?? d.pabellon;
              return (
                <tr
                  key={d.id}
                  className={`border-b border-border/60 ${
                    d.estado_devolucion === "saldo_a_favor"
                      ? "bg-brand-soft/10"
                      : ""
                  }`}
                >
                  <td className="p-3 font-medium">
                    <div className="flex items-center gap-2">
                      {stand && (
                        <StandAvatar
                          logoUrl={stand.logo_url}
                          nombre={stand.nombre}
                          size={26}
                        />
                      )}
                      {d.codigo ?? stand?.codigo ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 text-muted">{stand?.nombre ?? "—"}</td>
                  <td className="p-3 text-muted">
                    {stand?.cliente_nombre ?? "—"}
                  </td>
                  <td className="p-3 text-muted">{stand?.ciudad ?? "—"}</td>
                  <td className="p-3 text-muted">
                    {pabellon ? PABELLON_LABEL[pabellon] : "—"}
                  </td>
                  <td className="p-3 text-muted">{stand?.tamano ?? "—"}</td>
                  <td className="p-3">{stand ? fmtCOP(stand.precio) : "—"}</td>
                  <td className="p-3 text-muted">
                    {stand ? ESTADO_STANDS_LABEL[stand.estado] : "—"}
                  </td>
                  <td className="p-3">
                    {stand?.estado_venta ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_VENTA_STYLE[stand.estado_venta]}`}
                      >
                        {ESTADO_VENTA_LABEL[stand.estado_venta]}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="p-3 text-muted">
                    {stand?.asesor_nombre ?? "—"}
                  </td>
                  <td className="p-3">
                    {d.valor_pagado_hasta_devolucion != null
                      ? fmtCOP(d.valor_pagado_hasta_devolucion)
                      : "—"}
                  </td>
                  <td className="p-3">
                    {d.estado_devolucion ? (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_DEVOLUCION_STYLE[d.estado_devolucion]}`}
                      >
                        {ESTADO_DEVOLUCION_LABEL[d.estado_devolucion]}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-muted">{d.motivo ?? "—"}</td>
                  <td className="p-3 text-muted">
                    {d.fecha_devolucion ?? "—"}
                  </td>
                  <td className="p-3 text-muted">{d.observaciones ?? "—"}</td>
                  <td className="p-3">
                    {stand && (
                      <button
                        onClick={() => onVerStand(stand)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
                      >
                        Ver detalle
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
