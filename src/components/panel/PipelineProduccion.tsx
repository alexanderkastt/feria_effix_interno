"use client";

import { useState } from "react";
import {
  crearItemProduccion,
  moverEtapaProduccion,
  type EtapaProduccion,
  type CategoriaProduccion,
} from "@/app/panel/produccion/actions";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface ItemView {
  id: string;
  descripcion: string;
  categoria: CategoriaProduccion;
  etapa: EtapaProduccion;
  proveedor: string | null;
  costo_estimado: number | null;
  costo_real: number | null;
}

const ETAPAS = [
  { key: "planeado", label: "Planeado" },
  { key: "cotizado", label: "Cotizado" },
  { key: "contratado", label: "Contratado" },
  { key: "en_ejecucion", label: "En ejecución" },
  { key: "completado", label: "Completado" },
];

const CATEGORIAS: CategoriaProduccion[] = [
  "montaje",
  "sonido",
  "escenario",
  "catering",
  "transporte",
  "senaletica_fisica",
];

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const cat = (c: string) => c.replace("_", " ");

const COLS: ColumnaTabla<ItemView>[] = [
  { label: "Descripción", get: (i) => i.descripcion },
  {
    label: "Categoría",
    get: (i) => <span className="capitalize">{cat(i.categoria)}</span>,
  },
  { label: "Proveedor", get: (i) => i.proveedor ?? "—" },
  {
    label: "Costo estimado",
    get: (i) => (i.costo_estimado ? fmtCOP(Number(i.costo_estimado)) : "—"),
  },
  {
    label: "Costo real",
    get: (i) => (i.costo_real ? fmtCOP(Number(i.costo_real)) : "—"),
  },
];

export function PipelineProduccion({
  items,
  puedeEditar,
}: {
  items: ItemView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Producción</h1>
          <p className="text-sm text-muted">
            Montaje, sonido, escenario, catering…
            {!puedeEditar && " Solo lectura."}
          </p>
        </div>
        {puedeEditar && (
          <button
            onClick={() => setAbrir((v) => !v)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            {abrir ? "Cerrar" : "+ Nuevo ítem"}
          </button>
        )}
      </div>

      {abrir && puedeEditar && (
        <NuevoItemForm onCreado={() => setAbrir(false)} />
      )}

      <TableroConVistas<ItemView>
        items={items}
        getId={(i) => i.id}
        campoEtapa="etapa"
        etapas={ETAPAS}
        columnas={COLS}
        onMover={(id, etapa) =>
          moverEtapaProduccion(id, etapa as EtapaProduccion)
        }
        puedeEditar={puedeEditar}
        renderCard={(i) => (
          <>
            <p className="text-sm font-medium leading-snug">{i.descripcion}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 capitalize text-muted">
                {cat(i.categoria)}
              </span>
              {i.proveedor && <span className="text-muted">{i.proveedor}</span>}
            </div>
            {(i.costo_estimado || i.costo_real) && (
              <p className="mt-2 text-xs text-muted">
                {i.costo_real
                  ? `Real ${fmtCOP(Number(i.costo_real))}`
                  : `Est. ${fmtCOP(Number(i.costo_estimado))}`}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
}

function NuevoItemForm({ onCreado }: { onCreado: () => void }) {
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<CategoriaProduccion>("montaje");
  const [proveedor, setProveedor] = useState("");
  const [costo, setCosto] = useState("");
  const [pending, setPending] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (descripcion.trim().length < 2) return;
    setPending(true);
    const r = await crearItemProduccion({
      descripcion,
      categoria,
      proveedor,
      costo_estimado: Number(costo) || 0,
    });
    setPending(false);
    if (r.ok) {
      setDescripcion("");
      setProveedor("");
      setCosto("");
      setCategoria("montaje");
      onCreado();
    }
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción del ítem"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value as CategoriaProduccion)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {cat(c)}
          </option>
        ))}
      </select>
      <input
        value={proveedor}
        onChange={(e) => setProveedor(e.target.value)}
        placeholder="Proveedor (opc.)"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={costo}
        onChange={(e) => setCosto(e.target.value)}
        placeholder="Costo estimado (COP)"
        type="number"
        min="0"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2 lg:col-span-4"
      >
        {pending ? "Guardando…" : "Crear ítem"}
      </button>
    </form>
  );
}
