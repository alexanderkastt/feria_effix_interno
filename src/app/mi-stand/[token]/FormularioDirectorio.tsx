"use client";

import { useState, useTransition } from "react";
import {
  guardarFormularioDirectorio,
  type FormularioDirectorioInput,
} from "./actions";

export function FormularioDirectorio({
  token,
  inicial,
  completo,
}: {
  token: string;
  inicial: FormularioDirectorioInput;
  completo: boolean;
}) {
  const [valores, setValores] = useState(inicial);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [pending, startTransition] = useTransition();

  function campo(key: keyof FormularioDirectorioInput) {
    return {
      value: valores[key],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setValores((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);
    startTransition(async () => {
      const r = await guardarFormularioDirectorio(token, valores);
      if (r.ok) setExito(true);
      else setError(r.mensaje ?? "No se pudo guardar.");
    });
  }

  const inputClass =
    "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form onSubmit={guardar} className="space-y-3">
      {completo && !exito && (
        <p className="text-sm text-ok">
          ✓ Ya completaste este formulario. Podés actualizarlo cuando quieras.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo label="Nombre de la marca *">
          <input {...campo("nombre")} className={inputClass} />
        </Campo>
        <Campo label="País *">
          <input {...campo("pais")} className={inputClass} />
        </Campo>
        <Campo label="Ciudad *">
          <input {...campo("ciudad")} className={inputClass} />
        </Campo>
        <Campo label="Dirección (si aplica)">
          <input {...campo("direccion")} className={inputClass} />
        </Campo>
        <Campo label="Teléfono de contacto *">
          <input {...campo("telefono")} className={inputClass} />
        </Campo>
        <Campo label="Correo de contacto *">
          <input type="email" {...campo("email")} className={inputClass} />
        </Campo>
        <Campo label="Sitio web">
          <input {...campo("sitioWeb")} className={inputClass} />
        </Campo>
        <Campo label="Redes sociales">
          <input
            {...campo("redesSociales")}
            placeholder="Instagram, Facebook, TikTok…"
            className={inputClass}
          />
        </Campo>
      </div>
      <Campo label="Descripción breve de la marca">
        <textarea {...campo("descripcion")} rows={3} className={inputClass} />
      </Campo>

      {error && <p className="text-sm text-danger">{error}</p>}
      {exito && <p className="text-sm text-ok">¡Guardado correctamente!</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar datos del directorio"}
      </button>
    </form>
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
