"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buscarGlobal, type ResultadoBusqueda } from "./searchAction";

const TIPO_LABEL: Record<string, string> = {
  tarea: "Tareas",
  ponente: "Ponentes",
  stand: "Stands",
  patrocinio: "Patrocinios",
  contacto: "Contactos",
  archivo: "Biblioteca",
  decision: "Estrategia",
};

export function GlobalSearch() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([]);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajo Cmd/Ctrl + K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((v) => !v);
      }
      if (e.key === "Escape") setAbierto(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 30);
  }, [abierto]);

  // Debounce de la consulta
  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setResultados([]);
        return;
      }
      setCargando(true);
      const r = await buscarGlobal(q);
      setResultados(r);
      setCargando(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q, abierto]);

  function ir(ruta: string) {
    setAbierto(false);
    setQ("");
    router.push(ruta);
  }

  const grupos = resultados.reduce<Record<string, ResultadoBusqueda[]>>(
    (acc, r) => {
      (acc[r.tipo] ??= []).push(r);
      return acc;
    },
    {},
  );

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand/50"
      >
        <span>Buscar…</span>
        <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px]">
          Ctrl K
        </kbd>
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[10vh]"
          onClick={() => setAbierto(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar tareas, stands, patrocinios, contactos, archivos…"
              className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
            />
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {cargando && (
                <p className="px-3 py-4 text-sm text-muted">Buscando…</p>
              )}
              {!cargando && q.trim().length >= 2 && resultados.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted">Sin resultados.</p>
              )}
              {Object.entries(grupos).map(([tipo, items]) => (
                <div key={tipo} className="mb-2">
                  <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {TIPO_LABEL[tipo] ?? tipo}
                  </p>
                  {items.map((r) => (
                    <button
                      key={`${r.tipo}-${r.id}`}
                      onClick={() => ir(r.ruta)}
                      className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-2"
                    >
                      <span className="text-sm">{r.titulo}</span>
                      {r.subtitulo && (
                        <span className="text-xs text-muted">
                          {r.subtitulo}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
