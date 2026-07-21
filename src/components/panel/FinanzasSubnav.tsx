"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/panel/finanzas/presupuesto", label: "Presupuesto maestro" },
  { href: "/panel/finanzas/movimientos", label: "Movimientos" },
  { href: "/panel/finanzas/venue", label: "Venue" },
] as const;

export function FinanzasSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-2">
      {ITEMS.map((item) => {
        const activo = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              activo
                ? "border-brand bg-brand-soft/30 text-brand"
                : "border-border bg-surface text-foreground hover:border-brand hover:text-brand"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
