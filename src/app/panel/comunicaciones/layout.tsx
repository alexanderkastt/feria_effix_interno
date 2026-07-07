import Link from "next/link";
import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Módulo Comunicaciones: accesible por marketing o admin.
export default async function ComunicacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await getSesion();
  const ok =
    sesion &&
    (sesion.esAdmin || sesion.areas.some((a) => a.slug === "marketing"));
  if (!ok) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Comunicaciones</h1>
        <p className="text-sm text-muted">
          Contactos, audiencias y campañas de Feria Effix 2026.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1 border-b border-border">
        <Tab href="/panel/comunicaciones/contactos" label="Contactos" />
        <Tab href="/panel/comunicaciones/audiencias" label="Audiencias" />
        <Tab href="/panel/comunicaciones/plantillas" label="Plantillas" />
        <Tab href="/panel/comunicaciones/campanas" label="Campañas" />
        <Tab href="/panel/comunicaciones/whatsapp" label="WhatsApp" />
        <Tab href="/panel/comunicaciones/reportes" label="Reportes" />
      </nav>
      {children}
    </div>
  );
}

function Tab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-t-md px-4 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
    >
      {label}
    </Link>
  );
}
