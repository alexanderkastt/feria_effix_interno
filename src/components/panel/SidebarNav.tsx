"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AreaMeta } from "@/lib/areas";

// Nav lateral del panel. Recibe las áreas ya filtradas por permisos del usuario.
export function SidebarNav({
  areas,
  mostrarDashboard,
  esAdmin,
}: {
  areas: AreaMeta[];
  mostrarDashboard: boolean;
  esAdmin: boolean;
}) {
  const pathname = usePathname();
  const tieneMarketing = esAdmin || areas.some((a) => a.slug === "marketing");

  const item = (href: string, label: string) => {
    const activo = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
          activo
            ? "bg-brand-soft/50 font-medium text-brand"
            : "text-muted hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  const titulo = (t: string) => (
    <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted">
      {t}
    </p>
  );

  return (
    <nav className="flex flex-col gap-1">
      {mostrarDashboard && item("/panel", "Dashboard")}

      {titulo("Áreas")}
      {areas.map((a) => item(`/panel/${a.slug}`, a.label))}

      {titulo("Medición")}
      {item("/panel/medicion", "KPIs / Medición")}
      {item("/panel/okrs", "OKRs")}

      {titulo("Herramientas")}
      {item("/panel/reportes", "Reportes")}
      {tieneMarketing &&
        item("/panel/comunicaciones/contactos", "Comunicaciones")}
      {item("/panel/transversales", "Tareas transversales")}
      {item("/panel/biblioteca", "Biblioteca")}
      {tieneMarketing &&
        item("/panel/marketing/historico", "Histórico marketing")}
      {esAdmin && item("/panel/contexto", "Contexto del evento")}

      {esAdmin && (
        <>
          {titulo("Administración")}
          {item("/panel/admin/usuarios", "Usuarios")}
        </>
      )}
    </nav>
  );
}
