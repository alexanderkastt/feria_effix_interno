"use client";

import { useState } from "react";
import {
  IVA_STANDS,
  calcularValorEstandar,
  fmtCOP,
  type Pabellon,
} from "@/components/panel/stands-shared";

export function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

type ModoPrecio =
  | "estandar"
  | "descuento_valor"
  | "descuento_porcentaje"
  | "manual";

// Tarifa oficial: $700.000/m² ($400.000/m² en zona de comidas) + 19% IVA.
// El área sale del tamaño ("AxB", en metros) y se recalcula en vivo apenas
// cambia tamaño o pabellón — es la base de los 4 modos:
//   - estandar: tarifa oficial tal cual.
//   - descuento_valor: tarifa oficial menos un monto fijo en pesos.
//   - descuento_porcentaje: tarifa oficial menos un %.
//   - manual: negociación especial, valor totalmente libre.
// valorConIva siempre se deriva de valorSinIva * 1.19 (no es un campo aparte).
export function usePrecioStand(
  tamano: string,
  pabellon: Pabellon | null,
  inicial?: { modo?: ModoPrecio; manualSinIva?: number | null },
) {
  const [modo, setModo] = useState<ModoPrecio>(inicial?.modo ?? "estandar");
  const [descuentoPct, setDescuentoPct] = useState("0");
  const [descuentoValor, setDescuentoValor] = useState("0");
  const [manualSinIva, setManualSinIva] = useState(
    inicial?.manualSinIva != null ? String(inicial.manualSinIva) : "",
  );

  const estandar = calcularValorEstandar(tamano.trim() || null, pabellon);

  let valorSinIva: number | null;
  if (modo === "manual") {
    valorSinIva = manualSinIva ? Number(manualSinIva) : null;
  } else if (modo === "descuento_porcentaje") {
    const pct = Number(descuentoPct) || 0;
    valorSinIva = estandar
      ? Math.round(estandar.valorSinIva * (1 - pct / 100))
      : null;
  } else if (modo === "descuento_valor") {
    const descuento = Number(descuentoValor) || 0;
    valorSinIva = estandar
      ? Math.max(0, Math.round(estandar.valorSinIva - descuento))
      : null;
  } else {
    valorSinIva = estandar?.valorSinIva ?? null;
  }
  const valorConIva =
    valorSinIva != null ? Math.round(valorSinIva * (1 + IVA_STANDS)) : null;

  return {
    modo,
    setModo,
    descuentoPct,
    setDescuentoPct,
    descuentoValor,
    setDescuentoValor,
    manualSinIva,
    setManualSinIva,
    estandar,
    valorSinIva,
    valorConIva,
  };
}

export function PrecioStandEditor({
  precio,
}: {
  precio: ReturnType<typeof usePrecioStand>;
}) {
  const dependeDelArea = precio.modo !== "manual";
  const sinArea = dependeDelArea && !precio.estandar;

  return (
    <div className="space-y-2 rounded-md border border-border bg-surface-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Precio ($700.000/m² · $400.000/m² zona de comidas · +19% IVA)
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {(
          [
            ["estandar", "Estándar"],
            ["descuento_valor", "Descuento $"],
            ["descuento_porcentaje", "Descuento %"],
            ["manual", "Negociación especial"],
          ] as [ModoPrecio, string][]
        ).map(([valor, label]) => (
          <button
            key={valor}
            type="button"
            onClick={() => precio.setModo(valor)}
            className={`rounded-full border px-2 py-1 ${
              precio.modo === valor
                ? "border-brand bg-brand-soft/30 text-brand"
                : "border-border text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {precio.estandar && precio.modo !== "estandar" && (
        <p className="text-xs text-muted">
          Valor estándar de referencia: {fmtCOP(precio.estandar.valorSinIva)}{" "}
          sin IVA
        </p>
      )}

      {precio.modo === "descuento_valor" && (
        <Campo label="Descuento (valor en $, sin IVA)">
          <input
            value={precio.descuentoValor}
            onChange={(e) => precio.setDescuentoValor(e.target.value)}
            type="number"
            min="0"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
      )}
      {precio.modo === "descuento_porcentaje" && (
        <Campo label="Descuento (%)">
          <input
            value={precio.descuentoPct}
            onChange={(e) => precio.setDescuentoPct(e.target.value)}
            type="number"
            min="0"
            max="100"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
      )}
      {precio.modo === "manual" && (
        <Campo label="Valor sin IVA (negociación especial)">
          <input
            value={precio.manualSinIva}
            onChange={(e) => precio.setManualSinIva(e.target.value)}
            type="number"
            min="0"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
      )}
      {sinArea && (
        <p className="text-xs text-warn">
          No se pudo calcular el área desde el tamaño (formato esperado "4x2").
          Elegí "Negociación especial" para cargar el valor a mano.
        </p>
      )}

      <div className="flex justify-between text-sm">
        <span className="text-muted">Valor sin IVA</span>
        <span>
          {precio.valorSinIva != null ? fmtCOP(precio.valorSinIva) : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-md border border-brand/40 bg-brand-soft/10 px-3 py-2">
        <span className="text-sm font-semibold text-muted">
          Total a pagar (con IVA)
        </span>
        <span className="text-lg font-bold text-brand">
          {precio.valorConIva != null ? fmtCOP(precio.valorConIva) : "—"}
        </span>
      </div>
    </div>
  );
}
