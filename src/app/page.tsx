import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Logo />
        <Link
          href="/login"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Ingresar al panel
        </Link>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            Feria Effix 2026 · Medellín · 16–18 de octubre
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            El panel operativo interno del equipo organizador.
          </h1>
          <p className="max-w-2xl text-lg text-muted">
            Una sola plataforma para las 11 áreas del evento: tareas, tableros,
            patrocinios, stands y ponentes. Reemplaza las hojas sueltas de
            Google, los formularios dispersos y el WhatsApp.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card
            href="/login"
            title="Panel del equipo"
            desc="Acceso con enlace mágico por correo. Cada quien ve solo sus áreas."
            cta="Ingresar"
            primary
          />
          <Card
            href="/postular-ponente"
            title="Postular como ponente"
            desc="Formulario público para proponer una charla en Feria Effix 2026."
            cta="Postularme"
          />
          <Card
            href="/mapa-stands"
            title="Mapa de stands"
            desc="Plano comercial de Plaza Mayor y disponibilidad de espacios."
            cta="Ver mapa"
          />
        </div>
      </section>

      <footer className="border-t border-border px-6 py-4 text-sm text-muted">
        Feria Effix · Grupo Effix · uso interno
      </footer>
    </main>
  );
}

function Card({
  href,
  title,
  desc,
  cta,
  primary = false,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-xl border p-5 transition-colors ${
        primary
          ? "border-brand/40 bg-brand-soft/30 hover:border-brand"
          : "border-border bg-surface hover:border-brand/50"
      }`}
    >
      <div className="space-y-2">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      <span className="mt-4 text-sm font-medium text-brand">
        {cta}{" "}
        <span className="inline-block transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </span>
    </Link>
  );
}
