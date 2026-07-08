import Link from "next/link";
import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  PipelineMarketing,
  type IniciativaView,
} from "@/components/panel/PipelineMarketing";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();
  const acceso = sesion.areas.find((a) => a.slug === "marketing");
  if (!sesion.esRoot && !acceso) notFound();
  const puedeEditar =
    sesion.esAdmin || (acceso ? acceso.nivel !== "lectura" : false);

  const supabase = await createClient();
  const { data } = await supabase
    .from("iniciativas_marketing")
    .select(
      "id, titulo, canal, etapa, presupuesto_asignado, resultado_principal",
    )
    .order("creado_en", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/panel/marketing/historico"
          className="rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-brand/50 hover:text-foreground"
        >
          Ver histórico de campañas →
        </Link>
      </div>
      <PipelineMarketing
        iniciativas={(data ?? []) as IniciativaView[]}
        puedeEditar={puedeEditar}
      />
    </div>
  );
}
