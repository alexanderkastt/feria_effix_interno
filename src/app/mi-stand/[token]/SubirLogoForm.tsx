"use client";

import { useState, useTransition } from "react";
import { subirLogoStandPublico } from "./actions";

export function SubirLogoForm({ token }: { token: string }) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) {
      setError("Elegí un archivo primero.");
      return;
    }
    setError(null);
    setExito(false);
    const fd = new FormData();
    fd.set("logo", archivo);
    startTransition(async () => {
      const r = await subirLogoStandPublico(token, fd);
      if (r.ok) {
        setExito(true);
        setArchivo(null);
      } else {
        setError(r.mensaje ?? "No se pudo subir el logo.");
      }
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(e) => {
          setArchivo(e.target.files?.[0] ?? null);
          setExito(false);
        }}
        className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-foreground"
      />
      <p className="text-xs text-muted">PNG, JPG, WEBP o SVG. Máximo 5 MB.</p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {exito && (
        <p className="text-sm text-ok">¡Logo actualizado correctamente!</p>
      )}
      <button
        type="submit"
        disabled={pending || !archivo}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Subiendo…" : "Subir logo"}
      </button>
    </form>
  );
}
