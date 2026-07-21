"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AreaMeta } from "@/lib/areas";

// Nav lateral del panel. Recibe las áreas ya filtradas por permisos del usuario.
export function SidebarNav({
  areas,
  mostrarDashboard,
  esAdmin,
  esRoot,
}: {
  areas: AreaMeta[];
  mostrarDashboard: boolean;
  esAdmin: boolean;
  esRoot: boolean;
}) {
  const pathname = usePathname();
  // Comunicaciones vive bajo el módulo "marketing" — mismo gate de
  // listo/root que el resto de los módulos, no el esAdmin genérico.
  const tieneMarketing = esRoot || areas.some((a) => a.slug === "marketing");

  const item = (href: string, label: string, indicador?: React.ReactNode) => {
    const activo = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          activo
            ? "bg-brand-soft/50 font-medium text-brand"
            : "text-muted hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        <span>{label}</span>
        {indicador}
      </Link>
    );
  };

  // Indicador cosmético de estado del módulo: check verde si ya está listo
  // para todo el equipo, punto ámbar si se está construyendo activamente
  // ahora mismo. Los módulos sin ninguno de los dos flags no muestran nada.
  const indicadorEstado = (a: AreaMeta) => {
    if (a.listo) {
      return (
        <span
          title="Módulo listo"
          className="text-xs font-semibold text-green-600 dark:text-green-500"
        >
          ✓
        </span>
      );
    }
    if (a.enProgreso) {
      return (
        <span
          title="En construcción"
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
        />
      );
    }
    return null;
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
      {areas.map((a) => item(`/panel/${a.slug}`, a.label, indicadorEstado(a)))}

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
