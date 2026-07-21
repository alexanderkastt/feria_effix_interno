"use client";

import { useMemo, useState, useTransition } from "react";
import {
  crearEscenarioVenue,
  type LineaEspacioInput,
  type UnidadTarifaVenue,
} from "@/app/panel/finanzas/venue/actions";
import { FinanzasSubnav } from "@/components/panel/FinanzasSubnav";

export interface LineaVenueView {
  id: string;
  nombre_espacio: string;
  tarifa_unidad: number | null;
  unidad_tarifa: UnidadTarifaVenue;
  unidades: number;
  subtotal: number;
}

export interface EscenarioVenueView {
  id: string;
  nombre_escenario: string;
  edicion: string;
  total_bruto: number | null;
  iva: number | null;
  total_neto: number | null;
  incremento_ipc_estimado: number | null;
  lineas: LineaVenueView[];
}

const UNIDADES_TARIFA: UnidadTarifaVenue[] = ["CD", "EA", "otro"];

const TOOLTIP_UNIDAD_TARIFA =
  "Unidad según tarifa de Plaza Mayor — confirmar significado exacto con el contrato antes de usar para negociar la próxima edición.";

const cop = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);

const num2 = (n: number) =>
  new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(n);

export function VenueComparador({
  escenarios,
  puedeCrear,
}: {
  escenarios: EscenarioVenueView[];
  puedeCrear: boolean;
}) {
  const [creandoAbierto, setCreandoAbierto] = useState(false);

  return (
    <div className="space-y-6">
      <FinanzasSubnav />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Venue — comparador de escenarios
          </h1>
          <p className="text-sm text-muted">
            Costos de arrendamiento de espacio en Plaza Mayor, comparados
            edición a edición, para decidir si conviene arrendar solo pabellones
            específicos o todo el recinto.
          </p>
        </div>
        {puedeCrear && (
          <button
            onClick={() => setCreandoAbierto(true)}
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            + Crear escenario nuevo
          </button>
        )}
      </div>

      {escenarios.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Todavía no hay escenarios de venue cargados.
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {escenarios.map((e) => (
            <EscenarioCard key={e.id} escenario={e} />
          ))}
        </div>
      )}

      {creandoAbierto && (
        <NuevoEscenarioModal
          escenariosBase={escenarios}
          onCerrar={() => setCreandoAbierto(false)}
        />
      )}
    </div>
  );
}

function EscenarioCard({ escenario }: { escenario: EscenarioVenueView }) {
  const sumaLineas = escenario.lineas.reduce((s, l) => s + l.subtotal, 0);

  return (
    <section className="flex w-[340px] shrink-0 flex-col rounded-xl border border-border bg-surface p-5">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold leading-snug">
            {escenario.nombre_escenario}
          </h2>
          <span className="shrink-0 rounded-full border border-brand/50 bg-brand-soft/30 px-2 py-0.5 text-[11px] font-medium text-brand">
            {escenario.edicion}
          </span>
        </div>
        {escenario.incremento_ipc_estimado != null && (
          <p className="mt-1 text-xs text-muted">
            Incremento IPC estimado: {num2(escenario.incremento_ipc_estimado)}%
          </p>
        )}
      </header>

      <div className="-mx-1 flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-1 pb-2 font-medium">Espacio</th>
              <th className="px-1 pb-2 text-right font-medium">Un.</th>
              <th className="px-1 pb-2 font-medium">
                <span className="inline-flex items-center gap-1">
                  Tarifa
                  <InfoIcon texto={TOOLTIP_UNIDAD_TARIFA} />
                </span>
              </th>
              <th className="px-1 pb-2 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {escenario.lineas.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-3 text-center text-muted">
                  Sin espacios cargados.
                </td>
              </tr>
            ) : (
              escenario.lineas.map((l) => (
                <tr key={l.id} className="border-b border-border/60">
                  <td className="px-1 py-1.5">{l.nombre_espacio}</td>
                  <td className="px-1 py-1.5 text-right text-muted">
                    {num2(l.unidades)}
                  </td>
                  <td className="px-1 py-1.5 text-muted">{l.unidad_tarifa}</td>
                  <td className="px-1 py-1.5 text-right">{cop(l.subtotal)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
        <FilaTotal label="Suma de líneas" valor={cop(sumaLineas)} muted />
        <FilaTotal label="Total bruto" valor={cop(escenario.total_bruto)} />
        <FilaTotal label="IVA" valor={cop(escenario.iva)} muted />
        <FilaTotal
          label="Total neto"
          valor={cop(escenario.total_neto)}
          destacado
        />
      </footer>
    </section>
  );
}

function FilaTotal({
  label,
  valor,
  muted,
  destacado,
}: {
  label: string;
  valor: string;
  muted?: boolean;
  destacado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted" : ""}>{label}</span>
      <span
        className={
          destacado ? "font-semibold text-brand" : muted ? "text-muted" : ""
        }
      >
        {valor}
      </span>
    </div>
  );
}

function InfoIcon({ texto }: { texto: string }) {
  return (
    <span
      tabIndex={0}
      title={texto}
      className="group relative inline-flex cursor-help items-center outline-none"
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className="h-3.5 w-3.5 text-muted group-hover:text-brand group-focus:text-brand"
      >
        <circle cx="10" cy="10" r="8.5" stroke="currentColor" />
        <rect
          x="9.1"
          y="8.5"
          width="1.8"
          height="5.5"
          rx="0.9"
          fill="currentColor"
        />
        <circle cx="10" cy="6" r="1" fill="currentColor" />
      </svg>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-md border border-border bg-surface-2 p-2 text-[11px] font-normal normal-case leading-snug text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {texto}
      </span>
    </span>
  );
}

/* ============================================================================
 * Formulario: crear escenario nuevo
 * ========================================================================= */

interface LineaForm extends LineaEspacioInput {
  key: string;
}

let contadorKey = 0;
function nuevaKey() {
  contadorKey += 1;
  return `linea-${contadorKey}`;
}

function lineaVacia(): LineaForm {
  return {
    key: nuevaKey(),
    nombre_espacio: "",
    tarifa_unidad: null,
    unidad_tarifa: "otro",
    unidades: 1,
    subtotal: 0,
  };
}

function NuevoEscenarioModal({
  escenariosBase,
  onCerrar,
}: {
  escenariosBase: EscenarioVenueView[];
  onCerrar: () => void;
}) {
  const [baseId, setBaseId] = useState<string>("");
  const [nombreEscenario, setNombreEscenario] = useState("");
  const [edicion, setEdicion] = useState("");
  const [iva, setIva] = useState<string>("");
  const [incrementoIpc, setIncrementoIpc] = useState<string>("");
  const [lineas, setLineas] = useState<LineaForm[]>([lineaVacia()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totalBruto = useMemo(
    () => lineas.reduce((s, l) => s + (Number(l.subtotal) || 0), 0),
    [lineas],
  );
  const ivaNum = Number(iva) || 0;
  const totalNeto = totalBruto + ivaNum;

  function elegirBase(id: string) {
    setBaseId(id);
    if (!id) return;
    const base = escenariosBase.find((e) => e.id === id);
    if (!base) return;
    setNombreEscenario(`${base.nombre_escenario} (copia)`);
    setEdicion(base.edicion);
    setLineas(
      base.lineas.length > 0
        ? base.lineas.map((l) => ({
            key: nuevaKey(),
            nombre_espacio: l.nombre_espacio,
            tarifa_unidad: l.tarifa_unidad,
            unidad_tarifa: l.unidad_tarifa,
            unidades: l.unidades,
            subtotal: l.subtotal,
          }))
        : [lineaVacia()],
    );
  }

  function actualizarLinea(key: string, cambios: Partial<LineaForm>) {
    setLineas((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...cambios } : l)),
    );
  }

  function quitarLinea(key: string) {
    setLineas((prev) => prev.filter((l) => l.key !== key));
  }

  function sugerirSubtotal(l: LineaForm) {
    if (l.tarifa_unidad == null) return;
    actualizarLinea(l.key, {
      subtotal: Math.round(l.tarifa_unidad * l.unidades * 100) / 100,
    });
  }

  function sugerirIva19() {
    setIva(String(Math.round(totalBruto * 0.19 * 100) / 100));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombreEscenario.trim()) {
      setError("El nombre del escenario es obligatorio.");
      return;
    }
    if (!edicion.trim()) {
      setError('La edición es obligatoria (ej. "2026").');
      return;
    }
    const lineasValidas = lineas.filter((l) => l.nombre_espacio.trim());
    if (lineasValidas.length === 0) {
      setError("Agregá al menos un espacio con nombre.");
      return;
    }

    startTransition(async () => {
      const r = await crearEscenarioVenue({
        nombre_escenario: nombreEscenario,
        edicion,
        total_bruto: totalBruto,
        iva: ivaNum,
        total_neto: totalNeto,
        incremento_ipc_estimado: incrementoIpc.trim()
          ? Number(incrementoIpc)
          : null,
        lineas: lineasValidas.map((l) => ({
          nombre_espacio: l.nombre_espacio,
          tarifa_unidad: l.tarifa_unidad,
          unidad_tarifa: l.unidad_tarifa,
          unidades: Number(l.unidades) || 0,
          subtotal: Number(l.subtotal) || 0,
        })),
      });
      if (r.ok) {
        onCerrar();
      } else {
        setError(r.mensaje ?? "No se pudo crear el escenario.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <form
        onSubmit={guardar}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Crear escenario nuevo</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <Campo label="Partir de un escenario existente (opcional)">
          <select
            value={baseId}
            onChange={(e) => elegirBase(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Empezar en blanco</option>
            {escenariosBase.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre_escenario} ({e.edicion})
              </option>
            ))}
          </select>
          <span className="block pt-1 text-[11px] text-muted">
            Copia sus espacios (nombre, unidades, tarifa y subtotal) como punto
            de partida editable.
          </span>
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Nombre del escenario *">
            <input
              value={nombreEscenario}
              onChange={(e) => setNombreEscenario(e.target.value)}
              placeholder='Ej. "Solo pabellones 2027"'
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Edición *">
            <input
              value={edicion}
              onChange={(e) => setEdicion(e.target.value)}
              placeholder="Ej. 2027"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-muted">
              Espacios del escenario
              <InfoIcon texto={TOOLTIP_UNIDAD_TARIFA} />
            </span>
            <button
              type="button"
              onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
              className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
            >
              + Agregar espacio
            </button>
          </div>

          <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border p-2">
            {lineas.map((l) => (
              <div
                key={l.key}
                className="grid grid-cols-[1fr_90px_80px_90px_110px_28px] items-center gap-2 rounded-md bg-surface-2 p-2"
              >
                <input
                  value={l.nombre_espacio}
                  onChange={(e) =>
                    actualizarLinea(l.key, { nombre_espacio: e.target.value })
                  }
                  placeholder="Nombre del espacio"
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand"
                />
                <input
                  type="number"
                  step="0.01"
                  value={l.tarifa_unidad ?? ""}
                  onChange={(e) =>
                    actualizarLinea(l.key, {
                      tarifa_unidad:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="Tarifa/un."
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand"
                />
                <select
                  value={l.unidad_tarifa}
                  onChange={(e) =>
                    actualizarLinea(l.key, {
                      unidad_tarifa: e.target.value as UnidadTarifaVenue,
                    })
                  }
                  title={TOOLTIP_UNIDAD_TARIFA}
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand"
                >
                  {UNIDADES_TARIFA.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={l.unidades}
                  onChange={(e) =>
                    actualizarLinea(l.key, {
                      unidades: Number(e.target.value),
                    })
                  }
                  placeholder="Unidades"
                  className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={l.subtotal}
                    onChange={(e) =>
                      actualizarLinea(l.key, {
                        subtotal: Number(e.target.value),
                      })
                    }
                    placeholder="Subtotal"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => sugerirSubtotal(l)}
                    title="Sugerir: tarifa × unidades"
                    className="shrink-0 rounded-md border border-border px-1.5 py-1.5 text-[10px] text-muted hover:border-brand hover:text-brand"
                  >
                    =
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => quitarLinea(l.key)}
                  title="Quitar espacio"
                  className="shrink-0 rounded-md border border-border px-1.5 py-1.5 text-xs text-danger hover:border-danger"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Campo label="Total bruto (suma de líneas)">
            <input
              readOnly
              value={cop(totalBruto)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted outline-none"
            />
          </Campo>
          <Campo label="IVA">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={iva}
                onChange={(e) => setIva(e.target.value)}
                placeholder="0"
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={sugerirIva19}
                title="Sugerir 19% del total bruto"
                className="shrink-0 rounded-md border border-border px-2 py-2 text-[11px] text-muted hover:border-brand hover:text-brand"
              >
                19%
              </button>
            </div>
          </Campo>
          <Campo label="Total neto (bruto + IVA)">
            <input
              readOnly
              value={cop(totalNeto)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-muted outline-none"
            />
          </Campo>
        </div>

        <Campo label="Incremento IPC estimado, % (opcional)">
          <input
            type="number"
            step="0.01"
            value={incrementoIpc}
            onChange={(e) => setIncrementoIpc(e.target.value)}
            placeholder="Ej. 5.2"
            className="w-full max-w-[200px] rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        {error && (
          <p className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-brand hover:text-brand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Crear escenario"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({
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
