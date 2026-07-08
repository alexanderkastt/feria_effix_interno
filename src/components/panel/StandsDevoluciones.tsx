"use client";

import { useMemo, useState } from "react";
import { StandAvatar } from "@/components/StandAvatar";
import {
  FORMA_PAGO_LABEL,
  MEDIO_PAGO_LABEL,
  PABELLON_LABEL,
  fmtCOP,
  type FormaPagoRestante,
  type MedioPago,
  type Pabellon,
  type StandView,
} from "@/components/panel/stands-shared";

export type EstadoDevolucion =
  | "ok"
  | "pendiente_certificacion_bancaria"
  | "pendiente_documento_liquidacion"
  | "saldo_a_favor";

// Datos propios de la devolución (hoja "Devoluciones" del Excel), NO
// derivados de un join a `stands`: si el stand se libera o se revende
// después, esos campos en `stands` ya no reflejan quién realmente desistió.
export interface DevolucionView {
  id: string;
  stand_id: string | null;
  pabellon: Pabellon | null;
  codigo: string | null;
  medida: string | null;
  valor_sin_iva: number | null;
  valor_con_iva: number | null;
  precio_venta: number | null;
  nombre_comercial: string | null;
  nombre_fiscal: string | null;
  nombre_persona_encargada: string | null;
  numero_contacto: string | null;
  id_effi: string | null;
  ciudad: string | null;
  valor_pagado_hasta_devolucion: number | null;
  medio_pago_primer_abono: MedioPago | null;
  forma_pago_restante: FormaPagoRestante | null;
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

function valorRestanteDe(d: DevolucionView): number | null {
  if (d.precio_venta == null) return null;
  return d.precio_venta - (d.valor_pagado_hasta_devolucion ?? 0);
}

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
  const [detalle, setDetalle] = useState<DevolucionView | null>(null);

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
              <th className="p-3 font-medium">Pabellón</th>
              <th className="p-3 font-medium">Valor restante</th>
              <th className="p-3 font-medium">Estado devolución</th>
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted">
                  Sin devoluciones para este filtro.
                </td>
              </tr>
            )}
            {visibles.map((d) => {
              const stand = d.stand_id ? standsPorId.get(d.stand_id) : null;
              const valorRestante = valorRestanteDe(d);
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
                          nombre={d.nombre_comercial}
                          size={26}
                        />
                      )}
                      {d.codigo ?? "—"}
                    </div>
                  </td>
                  <td className="p-3 text-muted">
                    {d.nombre_comercial ?? "—"}
                  </td>
                  <td className="p-3 text-muted">
                    {d.pabellon ? PABELLON_LABEL[d.pabellon] : "—"}
                  </td>
                  <td className="p-3">
                    {valorRestante != null ? fmtCOP(valorRestante) : "—"}
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
                  <td className="p-3 text-muted">
                    {d.fecha_devolucion ?? "—"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setDetalle(d)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
                    >
                      Más detalles
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detalle && (
        <DevolucionDetalleModal
          devolucion={detalle}
          stand={
            detalle.stand_id
              ? (standsPorId.get(detalle.stand_id) ?? null)
              : null
          }
          onVerStand={onVerStand}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </div>
  );
}

function DevolucionDetalleModal({
  devolucion: d,
  stand,
  onVerStand,
  onCerrar,
}: {
  devolucion: DevolucionView;
  stand: StandView | null;
  onVerStand: (stand: StandView) => void;
  onCerrar: () => void;
}) {
  const valorRestante = valorRestanteDe(d);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {stand && (
              <StandAvatar
                logoUrl={stand.logo_url}
                nombre={d.nombre_comercial}
                size={44}
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">
                Stand {d.codigo ?? "—"}{" "}
                <span className="text-muted">
                  — {d.nombre_comercial ?? "—"}
                </span>
              </h2>
              <p className="text-sm text-muted">
                {d.pabellon ? PABELLON_LABEL[d.pabellon] : "Sin zona"}
                {d.medida ? ` · ${d.medida}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <InfoCard titulo="Cliente">
          <Dato label="Nombre comercial" valor={d.nombre_comercial} />
          <Dato label="Nombre fiscal" valor={d.nombre_fiscal} />
          <Dato label="Persona encargada" valor={d.nombre_persona_encargada} />
          <Dato label="Contacto" valor={d.numero_contacto} />
          <Dato label="ID Effi" valor={d.id_effi} />
          <Dato label="Ciudad" valor={d.ciudad} />
        </InfoCard>

        <InfoCard titulo="Valores">
          <Dato
            label="Valor sin IVA"
            valor={d.valor_sin_iva != null ? fmtCOP(d.valor_sin_iva) : null}
          />
          <Dato
            label="Valor con IVA"
            valor={d.valor_con_iva != null ? fmtCOP(d.valor_con_iva) : null}
          />
          <Dato
            label="Precio de venta"
            valor={d.precio_venta != null ? fmtCOP(d.precio_venta) : null}
          />
          <Dato
            label="Abonos"
            valor={
              d.valor_pagado_hasta_devolucion != null
                ? fmtCOP(d.valor_pagado_hasta_devolucion)
                : null
            }
          />
          <Dato
            label="Valor restante"
            valor={valorRestante != null ? fmtCOP(valorRestante) : null}
          />
          <Dato
            label="Medio de pago 1er abono"
            valor={
              d.medio_pago_primer_abono
                ? MEDIO_PAGO_LABEL[d.medio_pago_primer_abono]
                : null
            }
          />
          <Dato
            label="Cómo paga el restante"
            valor={
              d.forma_pago_restante
                ? FORMA_PAGO_LABEL[d.forma_pago_restante]
                : null
            }
          />
        </InfoCard>

        <InfoCard titulo="Devolución">
          <Dato
            label="Estado"
            valor={
              d.estado_devolucion
                ? ESTADO_DEVOLUCION_LABEL[d.estado_devolucion]
                : null
            }
          />
          <Dato label="Motivo" valor={d.motivo} />
          <Dato label="Fecha" valor={d.fecha_devolucion} />
          <Dato label="Observaciones" valor={d.observaciones} bloque />
        </InfoCard>

        {stand && (
          <button
            onClick={() => {
              onVerStand(stand);
              onCerrar();
            }}
            className="w-full rounded-md border border-border px-4 py-2 text-sm text-brand hover:border-brand"
          >
            Ver stand actual
          </button>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {titulo}
      </h3>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function Dato({
  label,
  valor,
  bloque,
}: {
  label: string;
  valor: string | null;
  bloque?: boolean;
}) {
  if (bloque) {
    return (
      <div className="py-1.5 text-sm">
        <p className="text-muted">{label}</p>
        <p className="mt-0.5">{valor ?? "—"}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span>{valor ?? "—"}</span>
    </div>
  );
}
