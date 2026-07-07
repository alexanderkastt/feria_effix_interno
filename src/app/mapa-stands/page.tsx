import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { liberarVencidos } from "./actions";
import {
  MapaStandsInteractivo,
  type StandPublico,
} from "@/components/stands/MapaStandsInteractivo";

export const dynamic = "force-dynamic";

export default async function MapaStandsPage() {
  // Libera bloqueos temporales vencidos antes de mostrar disponibilidad.
  await liberarVencidos();

  const supabase = await createClient();
  const { data } = await supabase
    .from("stands_publico")
    .select(
      "id, codigo, nombre, tamano, precio, estado, bloqueado_hasta, pabellon, tipo_stand, valor_con_iva",
    )
    .order("codigo");

  const stands = (data ?? []) as StandPublico[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <header className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">
          Plaza Mayor · Medellín
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Mapa de stands</h1>
        <p className="text-muted">
          Elegí un stand disponible y reservalo. Al reservar, queda bloqueado 30
          minutos para que completes tus datos.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-5">
        <MapaStandsInteractivo stands={stands} />
      </section>
    </main>
  );
}
