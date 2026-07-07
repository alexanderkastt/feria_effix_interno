"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { postularPonente, type PostulacionState } from "./actions";

const inicial: PostulacionState = { ok: false, mensaje: "" };

const FORMATOS = [
  { value: "ponencia_general", label: "Ponencia general" },
  { value: "conversatorio", label: "Conversatorio" },
  { value: "workshop", label: "Workshop" },
  { value: "pregunta_en_vivo", label: "Pregunta en vivo" },
  { value: "live_selling", label: "Live selling" },
];

export default function PostularPonentePage() {
  const [state, formAction, pending] = useActionState(postularPonente, inicial);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <header className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">
          Feria Effix 2026
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Postulate como ponente
        </h1>
        <p className="text-muted">
          Contanos quién sos y qué querés compartir en el escenario de Feria
          Effix 2026. Revisamos cada postulación manualmente.
        </p>
      </header>

      {state.ok ? (
        <div className="rounded-lg border border-ok/40 bg-ok/10 p-5 text-sm">
          {state.mensaje}
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          <Field name="nombre" label="Nombre completo" required />

          <Field
            name="tema_propuesto"
            label="Tema propuesto"
            required
            placeholder="Ej. Cómo escalé mi dropshipping a 6 cifras con IA"
          />

          <div className="space-y-1.5">
            <label htmlFor="formato" className="text-sm font-medium">
              Formato de participación <span className="text-brand">*</span>
            </label>
            <select
              id="formato"
              name="formato_participacion"
              required
              defaultValue=""
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="" disabled>
                Elegí un formato…
              </option>
              {FORMATOS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            name="experiencia_previa"
            label="Experiencia previa"
            placeholder="Charlas, eventos, logros relevantes…"
          />

          <Field
            name="video_url"
            label="Video de presentación (link opcional)"
            type="url"
            placeholder="https://…"
          />

          <fieldset className="space-y-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium text-muted">
              Redes sociales (opcional)
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="ig" label="Instagram" placeholder="@usuario" />
              <Field name="tiktok" label="TikTok" placeholder="@usuario" />
              <Field
                name="linkedin"
                label="LinkedIn"
                placeholder="perfil o URL"
              />
              <Field
                name="facebook"
                label="Facebook"
                placeholder="página o URL"
              />
              <Field name="youtube" label="YouTube" placeholder="canal o URL" />
            </div>
          </fieldset>

          {!state.ok && state.mensaje && (
            <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
              {state.mensaje}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? "Enviando…" : "Enviar postulación"}
          </button>
        </form>
      )}
    </main>
  );
}

function Field({
  name,
  label,
  required = false,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
    </div>
  );
}

function Textarea({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={4}
        placeholder={placeholder}
        className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
    </div>
  );
}
