import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { SidebarNav } from "@/components/panel/SidebarNav";
import { LogoutButton } from "@/components/panel/LogoutButton";
import { GlobalSearch } from "@/components/panel/GlobalSearch";
import { NotificacionesBell } from "@/components/panel/NotificacionesBell";
import { getSesion } from "@/lib/auth";

// Layout del panel interno. Protegido: sin sesión → /login.
// El sidebar se arma con las áreas accesibles del usuario (RLS + rol).
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface/40 p-4 md:flex">
        <Link href="/" className="mb-6 inline-block px-1">
          <Logo />
        </Link>
        <SidebarNav
          areas={sesion.areas}
          mostrarDashboard={sesion.esAdmin}
          esAdmin={sesion.esAdmin}
        />
        <div className="mt-auto rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
          Base local (Docker) · {sesion.areas.length} áreas visibles
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-3">
          <GlobalSearch />
          <div className="flex items-center gap-4">
            <NotificacionesBell />
            <span className="text-sm">
              {sesion.perfil.nombre}
              <span className="ml-2 rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-xs text-brand">
                {sesion.perfil.rol_base}
              </span>
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
