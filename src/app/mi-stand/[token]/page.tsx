import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubirLogoForm } from "./SubirLogoForm";

export const dynamic = "force-dynamic";

const PABELLON_LABEL: Record<string, string> = {
  azul: "Azul",
  amarillo: "Amarillo",
  blanco: "Blanco",
  rojo: "Rojo",
  zona_comidas: "Zona de comidas",
  burbujas: "Burbujas",
  gran_salon: "Gran salón",
  plazoleta: "Plazoleta",
  hall_verde: "Hall verde",
  hall: "Hall",
};

const TIPO_STAND_LABEL: Record<string, string> = {
  isla: "Isla",
  tipo_u: "Tipo U",
  esquinero: "Esquinero",
  lineal: "Lineal",
};

const CHECKLIST_LABEL: Record<string, string> = {
  contrato_entregado: "Contrato entregado",
  manual_entregado: "Manual entregado",
  logo_recibido: "Logo recibido",
  marcado_en_mapa: "Marcado en mapa",
  publicado_web: "Publicado en la web",
  imagen_enviada: "Imagen enviada",
  formulario_directorio_lleno: "Formulario de directorio",
  paz_y_salvo: "Paz y salvo",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function MiStandPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: stand } = await admin
    .from("stands")
    .select(
      `id, codigo, nombre, pabellon, tipo_stand, tamano, ciudad,
       estado_venta, valor_con_iva, precio_venta, valor_restante,
       fecha_venta, logo_url,
       contrato_entregado, manual_entregado, logo_recibido, marcado_en_mapa,
       publicado_web, imagen_enviada, formulario_directorio_lleno, paz_y_salvo`,
    )
    .eq("token_publico", token)
    .single();

  if (!stand) notFound();

  const { data: pagos } = await admin
    .from("pagos_stand")
    .select("id, monto, fecha")
    .eq("stand_id", stand.id)
    .order("fecha", { ascending: false });

  const checklist = Object.entries(CHECKLIST_LABEL) as [
    keyof typeof CHECKLIST_LABEL,
    string,
  ][];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-10">
      <Link href="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <header className="mb-8 space-y-2">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">
          Tu stand en Feria Effix 2026
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Stand {stand.codigo}
          {stand.nombre ? ` — ${stand.nombre}` : ""}
        </h1>
        <p className="text-muted">
          {stand.pabellon ? PABELLON_LABEL[stand.pabellon] : "Zona sin definir"}
          {stand.tipo_stand ? ` · ${TIPO_STAND_LABEL[stand.tipo_stand]}` : ""}
          {stand.tamano ? ` · ${stand.tamano}` : ""}
        </p>
      </header>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Logo de tu marca
        </h2>
        {stand.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stand.logo_url}
            alt={`Logo de ${stand.nombre ?? stand.codigo}`}
            className="mb-4 h-24 w-auto rounded-md border border-border bg-white object-contain p-2"
          />
        )}
        <SubirLogoForm token={token} />
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Comercial
          </h2>
          <Row
            k="Precio"
            v={fmtCOP(stand.precio_venta ?? stand.valor_con_iva ?? 0)}
          />
          <Row k="Saldo pendiente" v={fmtCOP(stand.valor_restante ?? 0)} />
          {stand.fecha_venta && (
            <Row k="Fecha de venta" v={stand.fecha_venta} />
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Checklist de tu stand
          </h2>
          <div className="space-y-1.5 text-sm">
            {checklist.map(([campo, label]) => {
              const activo = Boolean(
                (stand as unknown as Record<string, unknown>)[campo],
              );
              return (
                <div key={campo} className="flex items-center justify-between">
                  <span className="text-muted">{label}</span>
                  <span className={activo ? "text-ok" : "text-muted"}>
                    {activo ? "✓ Listo" : "Pendiente"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {pagos && pagos.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Abonos recibidos
          </h2>
          <table className="w-full text-sm">
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="py-1.5 text-muted">{p.fecha}</td>
                  <td className="py-1.5 text-right">
                    {fmtCOP(Number(p.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-muted">
        ¿Algo no coincide? Escribile al equipo comercial de Feria Effix.
      </p>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1.5 text-sm">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
