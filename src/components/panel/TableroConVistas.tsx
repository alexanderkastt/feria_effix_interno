"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";

export interface Etapa {
  key: string;
  label: string;
}

export interface ColumnaTabla<T> {
  label: string;
  get: (item: T) => ReactNode;
}

type Vista = "pipeline" | "tabla" | "lista";

interface Props<T> {
  items: T[];
  getId: (item: T) => string;
  campoEtapa: keyof T & string;
  etapas: Etapa[];
  columnas: ColumnaTabla<T>[];
  renderCard: (item: T) => ReactNode;
  onMover: (id: string, etapa: string) => Promise<{ ok: boolean }>;
  onAbrir?: (item: T) => void;
  puedeEditar: boolean;
  acciones?: ReactNode;
  vistaInicial?: Vista;
}

// Tablero reutilizable con 3 vistas: Pipeline (tablero arrastrable), Tabla y Lista.
// Maneja el movimiento entre etapas de forma optimista con revert si falla.
export function TableroConVistas<T>({
  items,
  getId,
  campoEtapa,
  etapas,
  columnas,
  renderCard,
  onMover,
  onAbrir,
  puedeEditar,
  acciones,
  vistaInicial = "pipeline",
}: Props<T>) {
  const [vista, setVista] = useState<Vista>(vistaInicial);
  const [lista, setLista] = useState<T[]>(items);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setLista(items);
  }, [items]);

  const etapaDe = (it: T) => String(it[campoEtapa]);
  const etapaLabel = (k: string) => etapas.find((e) => e.key === k)?.label ?? k;

  function mover(id: string, etapa: string) {
    const previa = lista;
    setLista((prev) =>
      prev.map((i) =>
        getId(i) === id ? ({ ...i, [campoEtapa]: etapa } as T) : i,
      ),
    );
    startTransition(async () => {
      const r = await onMover(id, etapa);
      if (!r.ok) setLista(previa);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Switcher vista={vista} setVista={setVista} />
        {acciones}
      </div>

      <div className={pending ? "opacity-70" : ""}>
        {vista === "pipeline" && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {etapas.map((col) => {
              const enCol = lista.filter((i) => etapaDe(i) === col.key);
              return (
                <div
                  key={col.key}
                  onDragOver={(e) => puedeEditar && e.preventDefault()}
                  onDrop={(e) => {
                    if (!puedeEditar) return;
                    const id = e.dataTransfer.getData("text/plain");
                    if (id) mover(id, col.key);
                  }}
                  className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-surface/60 p-3"
                >
                  <div className="mb-3 flex items-center justify-between px-1">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      {enCol.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {enCol.map((it) => (
                      <div
                        key={getId(it)}
                        draggable={puedeEditar}
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/plain", getId(it))
                        }
                        onClick={() => onAbrir?.(it)}
                        className={`rounded-lg border border-border bg-surface p-3 transition-colors hover:border-brand/50 ${puedeEditar ? "cursor-grab active:cursor-grabbing" : ""}`}
                      >
                        {renderCard(it)}
                      </div>
                    ))}
                    {enCol.length === 0 && (
                      <p className="px-1 py-6 text-center text-xs text-muted">
                        —
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {vista === "tabla" && (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  {columnas.map((c) => (
                    <th key={c.label} className="p-3 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="p-3 font-medium">Etapa</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((it) => (
                  <tr
                    key={getId(it)}
                    className="border-b border-border/60 hover:bg-surface-2/40"
                  >
                    {columnas.map((c) => (
                      <td
                        key={c.label}
                        className="cursor-pointer p-3"
                        onClick={() => onAbrir?.(it)}
                      >
                        {c.get(it)}
                      </td>
                    ))}
                    <td className="p-3">
                      {puedeEditar ? (
                        <select
                          value={etapaDe(it)}
                          disabled={pending}
                          onChange={(e) => mover(getId(it), e.target.value)}
                          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                        >
                          {etapas.map((e) => (
                            <option key={e.key} value={e.key}>
                              {e.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        etapaLabel(etapaDe(it))
                      )}
                    </td>
                  </tr>
                ))}
                {lista.length === 0 && (
                  <tr>
                    <td
                      colSpan={columnas.length + 1}
                      className="p-6 text-center text-muted"
                    >
                      Sin registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {vista === "lista" && (
          <div className="flex flex-col gap-2">
            {lista.map((it) => (
              <div
                key={getId(it)}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onAbrir?.(it)}
                >
                  {renderCard(it)}
                </div>
                {puedeEditar ? (
                  <select
                    value={etapaDe(it)}
                    disabled={pending}
                    onChange={(e) => mover(getId(it), e.target.value)}
                    className="shrink-0 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                  >
                    {etapas.map((e) => (
                      <option key={e.key} value={e.key}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="shrink-0 text-xs text-muted">
                    {etapaLabel(etapaDe(it))}
                  </span>
                )}
              </div>
            ))}
            {lista.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Sin registros
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Switcher({
  vista,
  setVista,
}: {
  vista: Vista;
  setVista: (v: Vista) => void;
}) {
  const opts: { key: Vista; label: string }[] = [
    { key: "pipeline", label: "Pipeline" },
    { key: "tabla", label: "Tabla" },
    { key: "lista", label: "Lista" },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-surface p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => setVista(o.key)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            vista === o.key
              ? "bg-brand text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
