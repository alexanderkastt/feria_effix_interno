import { notFound } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { StandAvatar } from "@/components/StandAvatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { FormularioDirectorio } from "./FormularioDirectorio";
import { SubirLogoForm } from "./SubirLogoForm";
import {
  CATEGORIA_LABEL,
  ESTADO_VENTA_LABEL,
  ESTADO_VENTA_STYLE,
  FORMA_PAGO_LABEL,
  FRECUENCIA_LABEL,
  MEDIO_PAGO_LABEL,
  PABELLON_LABEL,
  TIPO_PAGO_LABEL,
  TIPO_STAND_LABEL,
  fmtCOP,
} from "@/components/panel/stands-shared";

export const dynamic = "force-dynamic";

const CHECKLIST_LABEL: Record<string, string> = {
  contrato_entregado: "Contrato entregado",
  manual_entregado: "Manual entregado",
  logo_recibido: "Logo recibido",
  marcado_en_mapa: "Marcado en mapa",
  publicado_web: "Publicado en la web",
  imagen_enviada: "Imagen enviada",
  formulario_directorio_lleno: "Formulario de directorio",
  paz_y_salvo: "Paz y salvo",
  pantallazo_aceptacion: "Pantallazo de aceptación",
  aprobacion_tesoreria: "Aprobación de tesorería",
  facturado: "Facturado",
};

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
      `id, codigo, nombre, pabellon, tipo_stand, tamano, ciudad, logo_url,
       nombre_fiscal, nombre_persona_encargada, categoria_cliente, id_effi,
       primera_vez_en_feria,
       asesor_id, asesores_comerciales(nombre_completo),
       estado_venta, valor_sin_iva, valor_con_iva, precio_venta, valor_restante,
       valor_primer_abono, medio_pago_primer_abono, forma_pago_restante,
       fecha_venta, numero_factura, obsequio_de,
       contrato_entregado, manual_entregado, logo_recibido, marcado_en_mapa,
       publicado_web, imagen_enviada, formulario_directorio_lleno, paz_y_salvo,
       pantallazo_aceptacion, aprobacion_tesoreria, facturado,
       directorio_pais, directorio_direccion, directorio_telefono,
       directorio_email, directorio_sitio_web, directorio_descripcion,
       directorio_redes_sociales`,
    )
    .eq("token_publico", token)
    .single();

  if (!stand) notFound();

  const asesorNombre =
    (
      stand.asesores_comerciales as unknown as {
        nombre_completo: string;
      } | null
    )?.nombre_completo ?? null;

  const { data: pagos } = await admin
    .from("pagos_stand")
    .select("id, monto, fecha, medio_pago, tipo_pago")
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

      <header className="mb-8 flex items-center gap-4">
        <StandAvatar logoUrl={stand.logo_url} nombre={stand.nombre} size={72} />
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-widest text-brand">
            Tu stand en Feria Effix 2026
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Stand {stand.codigo}
            {stand.nombre ? ` — ${stand.nombre}` : ""}
          </h1>
          <p className="text-muted">
            {stand.pabellon
              ? PABELLON_LABEL[stand.pabellon as keyof typeof PABELLON_LABEL]
              : "Zona sin definir"}
            {stand.tipo_stand
              ? ` · ${TIPO_STAND_LABEL[stand.tipo_stand as keyof typeof TIPO_STAND_LABEL]}`
              : ""}
            {stand.tamano ? ` · ${stand.tamano}` : ""}
          </p>
        </div>
      </header>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Logo de tu marca
        </h2>
        <div className="mb-4 flex items-center gap-4">
          <StandAvatar
            logoUrl={stand.logo_url}
            nombre={stand.nombre}
            size={64}
          />
          <p className="text-sm text-muted">
            Así se va a ver tu logo. Subí uno nuevo para reemplazarlo.
          </p>
        </div>
        <SubirLogoForm token={token} />
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Cliente
          </h2>
          <Row k="Nombre fiscal" v={stand.nombre_fiscal} />
          <Row k="Persona encargada" v={stand.nombre_persona_encargada} />
          <Row k="Ciudad" v={stand.ciudad} />
          <Row
            k="Categoría"
            v={
              stand.categoria_cliente
                ? CATEGORIA_LABEL[
                    stand.categoria_cliente as keyof typeof CATEGORIA_LABEL
                  ]
                : null
            }
          />
          <Row k="Asesor comercial" v={asesorNombre} />
          <Row k="ID Effi" v={stand.id_effi} />
          <Row
            k="Frecuencia en la feria"
            v={
              stand.primera_vez_en_feria
                ? FRECUENCIA_LABEL[
                    stand.primera_vez_en_feria as keyof typeof FRECUENCIA_LABEL
                  ]
                : null
            }
          />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Comercial
            </h2>
            {stand.estado_venta && (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_VENTA_STYLE[stand.estado_venta as keyof typeof ESTADO_VENTA_STYLE]}`}
              >
                {
                  ESTADO_VENTA_LABEL[
                    stand.estado_venta as keyof typeof ESTADO_VENTA_LABEL
                  ]
                }
              </span>
            )}
          </div>
          <Row
            k="Valor sin IVA"
            v={stand.valor_sin_iva != null ? fmtCOP(stand.valor_sin_iva) : null}
          />
          <Row
            k="Valor con IVA"
            v={stand.valor_con_iva != null ? fmtCOP(stand.valor_con_iva) : null}
          />
          <Row
            k="Precio de venta"
            v={stand.precio_venta != null ? fmtCOP(stand.precio_venta) : null}
          />
          <Row k="Saldo pendiente" v={fmtCOP(stand.valor_restante ?? 0)} />
          <Row
            k="Primer abono"
            v={
              stand.valor_primer_abono != null
                ? fmtCOP(stand.valor_primer_abono)
                : null
            }
          />
          <Row
            k="Medio del primer abono"
            v={
              stand.medio_pago_primer_abono
                ? MEDIO_PAGO_LABEL[
                    stand.medio_pago_primer_abono as keyof typeof MEDIO_PAGO_LABEL
                  ]
                : null
            }
          />
          <Row
            k="Forma de pago restante"
            v={
              stand.forma_pago_restante
                ? FORMA_PAGO_LABEL[
                    stand.forma_pago_restante as keyof typeof FORMA_PAGO_LABEL
                  ]
                : null
            }
          />
          <Row k="Fecha de venta" v={stand.fecha_venta} />
          <Row k="N.º factura" v={stand.numero_factura} />
          {stand.estado_venta === "obsequio_directivo" && (
            <Row k="Obsequio de" v={stand.obsequio_de} />
          )}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Formulario de directorio
        </h2>
        <p className="mb-4 text-sm text-muted">
          Estos datos se van a usar en el futuro Directorio de Marcas de Feria
          Effix, para que posibles clientes te puedan contactar. Completá lo que
          falte (ya precargamos lo que tenemos).
        </p>
        <FormularioDirectorio
          token={token}
          completo={stand.formulario_directorio_lleno}
          inicial={{
            nombre: stand.nombre ?? "",
            ciudad: stand.ciudad ?? "",
            pais: stand.directorio_pais ?? "",
            direccion: stand.directorio_direccion ?? "",
            telefono: stand.directorio_telefono ?? "",
            email: stand.directorio_email ?? "",
            sitioWeb: stand.directorio_sitio_web ?? "",
            descripcion: stand.directorio_descripcion ?? "",
            redesSociales: stand.directorio_redes_sociales ?? "",
          }}
        />
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Checklist de tu stand
        </h2>
        <div className="grid gap-1.5 text-sm sm:grid-cols-2">
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
      </section>

      {pagos && pagos.length > 0 && (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Abonos recibidos
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 font-medium">Tipo</th>
                <th className="pb-2 font-medium">Medio de pago</th>
                <th className="pb-2 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="py-1.5 text-muted">{p.fecha}</td>
                  <td className="py-1.5 text-muted">
                    {p.tipo_pago
                      ? TIPO_PAGO_LABEL[
                          p.tipo_pago as keyof typeof TIPO_PAGO_LABEL
                        ]
                      : "—"}
                  </td>
                  <td className="py-1.5 text-muted">
                    {p.medio_pago
                      ? MEDIO_PAGO_LABEL[
                          p.medio_pago as keyof typeof MEDIO_PAGO_LABEL
                        ]
                      : "—"}
                  </td>
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
        Revisá que toda esta información sea correcta. Si algo no coincide,
        escribile al equipo comercial de Feria Effix.
      </p>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-1.5 text-sm">
      <span className="text-muted">{k}</span>
      <span className="font-medium">{v ?? "—"}</span>
    </div>
  );
}
