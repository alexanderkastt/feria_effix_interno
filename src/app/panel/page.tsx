import Link from "next/link";
import { redirect } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import type { EstadoTarea } from "@/lib/demo";
import {
  TermometroPatrocinios,
  ContadorStands,
  PostulacionesRecientes,
} from "@/components/panel/DashboardWidgets";

export const dynamic = "force-dynamic";

type Fila = Record<EstadoTarea, number>;

export default async function DashboardPage() {
  const sesion = await getSesion();
  if (!sesion) redirect("/login");

  // El dashboard consolidado es solo para directivo/administrativo.
  // Un gestor/colaborador entra directo a su primera área.
  if (!sesion.esAdmin) {
    if (sesion.areas.length > 0) redirect(`/panel/${sesion.areas[0].slug}`);
    redirect("/login");
  }

  const supabase = await createClient();
  const [tareasRes, patrociniosRes, standsRes, postulacionesRes, contextoRes] =
    await Promise.all([
      supabase.from("tareas").select("estado, areas(nombre)"),
      supabase.from("patrocinios").select("monto, estado_pago"),
      supabase.from("stands").select("estado"),
      supabase
        .from("postulaciones_ponentes")
        .select("nombre, estado, creado_en")
        .order("creado_en", { ascending: false })
        .limit(5),
      supabase
        .from("contexto_evento")
        .select("fecha_inicio")
        .order("edicion", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  // Tareas por área
  const resumen = new Map<AreaSlug, Fila>();
  let pendientes = 0;
  let bloqueadas = 0;
  for (const f of tareasRes.data ?? []) {
    const slug = (f.areas as unknown as { nombre: AreaSlug } | null)?.nombre;
    if (!slug) continue;
    const r =
      resumen.get(slug) ??
      ({ pendiente: 0, en_proceso: 0, bloqueado: 0, hecho: 0 } as Fila);
    r[f.estado as EstadoTarea] += 1;
    resumen.set(slug, r);
    if (f.estado === "pendiente") pendientes += 1;
    if (f.estado === "bloqueado") bloqueadas += 1;
  }

  // Termómetro de patrocinios
  let pagado = 0;
  let comprometido = 0;
  for (const p of patrociniosRes.data ?? []) {
    const monto = Number(p.monto) || 0;
    comprometido += monto;
    if (p.estado_pago === "pagado") pagado += monto;
  }

  // Stands por estado
  const conteoStands: Record<string, number> = {};
  for (const s of standsRes.data ?? []) {
    conteoStands[s.estado] = (conteoStands[s.estado] ?? 0) + 1;
  }

  const postulaciones = (postulacionesRes.data ?? []) as {
    nombre: string;
    estado: string;
    creado_en: string;
  }[];

  // Días restantes para el evento
  let diasRestantes: number | null = null;
  const fechaInicio = (
    contextoRes.data as unknown as { fecha_inicio: string | null } | null
  )?.fecha_inicio;
  if (fechaInicio) {
    // Dashboard dinamico: se calcula en servidor para mostrar el conteo del dia.
    // eslint-disable-next-line react-hooks/purity
    const ms = new Date(fechaInicio).getTime() - Date.now();
    diasRestantes = Math.max(0, Math.ceil(ms / 86400000));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted">
          Resumen operativo de Feria Effix 2026.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Tareas pendientes" valor={pendientes} />
        <Kpi label="Tareas bloqueadas" valor={bloqueadas} acento="danger" />
        <Kpi label="Áreas con actividad" valor={resumen.size} />
        <Kpi
          label="Días para el evento"
          valor={diasRestantes ?? 0}
          sufijo={diasRestantes === null ? " (sin fecha)" : ""}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TermometroPatrocinios pagado={pagado} comprometido={comprometido} />
        <ContadorStands conteo={conteoStands} />
      </div>

      <PostulacionesRecientes items={postulaciones} />

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Tareas por área
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 font-medium">Área</th>
                <th className="pb-2 text-center font-medium">Pendiente</th>
                <th className="pb-2 text-center font-medium">En proceso</th>
                <th className="pb-2 text-center font-medium">Bloqueado</th>
                <th className="pb-2 text-center font-medium">Hecho</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {resumen.size === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted">
                    Aún no hay tareas.
                  </td>
                </tr>
              )}
              {[...resumen.entries()].map(([area, r]) => (
                <tr key={area} className="border-b border-border/60">
                  <td className="py-2 font-medium">{AREA_LABEL[area]}</td>
                  <Celda n={r.pendiente} />
                  <Celda n={r.en_proceso} />
                  <Celda n={r.bloqueado} resaltar />
                  <Celda n={r.hecho} />
                  <td className="py-2 text-right">
                    <Link
                      href={`/panel/${area}`}
                      className="text-xs text-brand hover:underline"
                    >
                      Ver tablero →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({
  label,
  valor,
  acento,
  sufijo = "",
}: {
  label: string;
  valor: number;
  acento?: "danger";
  sufijo?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 text-3xl font-bold ${acento === "danger" ? "text-danger" : "text-brand"}`}
      >
        {valor}
        {sufijo && <span className="text-sm text-muted">{sufijo}</span>}
      </p>
    </div>
  );
}

function Celda({ n, resaltar }: { n: number; resaltar?: boolean }) {
  return (
    <td
      className={`py-2 text-center ${resaltar && n > 0 ? "font-semibold text-danger" : "text-muted"}`}
    >
      {n}
    </td>
  );
}
