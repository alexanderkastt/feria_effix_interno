import Link from "next/link";

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// Termómetro de facturación de patrocinios: pagado vs. comprometido (total).
export function TermometroPatrocinios({
  pagado,
  comprometido,
}: {
  pagado: number;
  comprometido: number;
}) {
  const pct =
    comprometido > 0
      ? Math.min(100, Math.round((pagado / comprometido) * 100))
      : 0;
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">
          Facturación de patrocinios
        </h2>
        <span className="text-sm font-semibold text-brand">{pct}%</span>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-ok">{fmtCOP(pagado)} pagado</span>
        <span className="text-muted">meta {fmtCOP(comprometido)}</span>
      </div>
    </section>
  );
}

const STAND_LABEL: Record<string, string> = {
  disponible: "Disponible",
  bloqueado_temporal: "Bloqueado",
  reservado: "Reservado",
  vendido: "Vendido",
};

export function ContadorStands({ conteo }: { conteo: Record<string, number> }) {
  const orden = ["disponible", "bloqueado_temporal", "reservado", "vendido"];
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">Stands por estado</h2>
        <Link
          href="/panel/stands"
          className="text-xs text-brand hover:underline"
        >
          Ver stands →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {orden.map((e) => (
          <div
            key={e}
            className="rounded-lg border border-border bg-surface-2 p-3"
          >
            <p className="text-xs text-muted">{STAND_LABEL[e]}</p>
            <p className="mt-1 text-xl font-bold text-brand">
              {conteo[e] ?? 0}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const EST_POST_STYLE: Record<string, string> = {
  pendiente_revision: "border-warn/50 bg-warn/10 text-warn",
  aceptado: "border-ok/50 bg-ok/10 text-ok",
  rechazado: "border-danger/50 bg-danger/10 text-danger",
  mas_info: "border-border bg-surface-2 text-muted",
};

export function PostulacionesRecientes({
  items,
}: {
  items: { nombre: string; estado: string; creado_en: string }[];
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted">
          Postulaciones de ponentes recientes
        </h2>
        <Link
          href="/panel/ponentes"
          className="text-xs text-brand hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Aún no hay postulaciones.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((p, i) => (
            <li key={i} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{p.nombre}</p>
                <p className="text-xs text-muted">
                  {new Date(p.creado_en).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-xs ${EST_POST_STYLE[p.estado] ?? "border-border text-muted"}`}
              >
                {p.estado.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
