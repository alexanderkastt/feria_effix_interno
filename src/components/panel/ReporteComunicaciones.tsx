import { AREA_LABEL } from "@/lib/areas";

// Presentación de los reportes de comunicación (Bloque E). Sin estado propio.
export interface ResumenComs {
  campanasEnviadas: number;
  enviados: number;
  entregados: number;
  tasaApertura: number;
  tasaClic: number;
  tasaDesuscripcion: number;
  contactosConsentidos: number;
  wa: { enviados: number; entregados: number; leidos: number };
}

export interface PorTipo {
  tipo: string;
  enviados: number;
  tasaApertura: number;
  tasaClic: number;
}

export interface CampanaAlerta {
  id: string;
  nombre: string;
  enviados: number;
  tasaRebote: number;
  tasaDesuscripcion: number;
  revisar: boolean;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

// Etiqueta legible del tipo_contacto (no es un área, así que mapeo simple).
const TIPO_LABEL: Record<string, string> = {
  comprador_boleta: "Compradores de boleta",
  postulante_ponente: "Postulantes a ponente",
  cliente_stand: "Clientes de stand",
  patrocinador: "Patrocinadores",
  aliado: "Aliados",
  comunidad: "Comunidades",
  embajador: "Embajadores",
  otro: "Otros",
};

export function ReporteComunicaciones({
  resumen,
  porTipo,
  campanas,
}: {
  resumen: ResumenComs;
  porTipo: PorTipo[];
  campanas: CampanaAlerta[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Reportes de comunicación
        </h1>
        <p className="text-sm text-muted">
          Email + WhatsApp · rendimiento y calidad de lista.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Campañas enviadas"
          valor={String(resumen.campanasEnviadas)}
        />
        <Kpi label="Correos enviados" valor={String(resumen.enviados)} />
        <Kpi label="Tasa de apertura" valor={pct(resumen.tasaApertura)} />
        <Kpi label="Tasa de clic" valor={pct(resumen.tasaClic)} />
        <Kpi
          label="Tasa de desuscripción"
          valor={pct(resumen.tasaDesuscripcion)}
        />
        <Kpi
          label="Contactos con consentimiento"
          valor={String(resumen.contactosConsentidos)}
        />
        <Kpi label="WhatsApp enviados" valor={String(resumen.wa.enviados)} />
        <Kpi label="WhatsApp leídos" valor={String(resumen.wa.leidos)} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Apertura y clic por tipo de contacto
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 text-center font-medium">Enviados</th>
              <th className="pb-2 text-center font-medium">Apertura</th>
              <th className="pb-2 text-center font-medium">Clic</th>
            </tr>
          </thead>
          <tbody>
            {porTipo.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted">
                  Aún no hay envíos registrados.
                </td>
              </tr>
            )}
            {porTipo.map((t) => (
              <tr key={t.tipo} className="border-b border-border/60">
                <td className="py-2 font-medium">
                  {TIPO_LABEL[t.tipo] ?? AREA_LABEL[t.tipo as never] ?? t.tipo}
                </td>
                <td className="py-2 text-center text-muted">{t.enviados}</td>
                <td className="py-2 text-center">{pct(t.tasaApertura)}</td>
                <td className="py-2 text-center">{pct(t.tasaClic)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Campañas · alertas de calidad
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 font-medium">Campaña</th>
              <th className="pb-2 text-center font-medium">Enviados</th>
              <th className="pb-2 text-center font-medium">Rebote</th>
              <th className="pb-2 text-center font-medium">Desuscripción</th>
              <th className="pb-2 text-center font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {campanas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-muted">
                  Aún no hay campañas enviadas.
                </td>
              </tr>
            )}
            {campanas.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="py-2 font-medium">{c.nombre}</td>
                <td className="py-2 text-center text-muted">{c.enviados}</td>
                <td className="py-2 text-center">{pct(c.tasaRebote)}</td>
                <td className="py-2 text-center">{pct(c.tasaDesuscripcion)}</td>
                <td className="py-2 text-center">
                  {c.revisar ? (
                    <span className="rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 text-xs text-danger">
                      ⚠ revisar
                    </span>
                  ) : (
                    <span className="rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">
          Se marca &quot;revisar&quot; si el rebote supera 5% o la desuscripción
          supera 2%.
        </p>
      </section>
    </div>
  );
}

function Kpi({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-brand">{valor}</p>
    </div>
  );
}
