"use client";

import { useState, useTransition } from "react";
import {
  registrarIngreso,
  solicitarGasto,
  cambiarEstadoGasto,
} from "@/app/panel/finanzas/actions";

type FuenteIngreso = "boleteria" | "stands" | "patrocinios" | "otros";
type EstadoIngreso = "proyectado" | "confirmado" | "cobrado";
type CategoriaGasto =
  | "produccion"
  | "logistica"
  | "marketing"
  | "talento"
  | "tecnologia"
  | "alianzas"
  | "otros";
type EstadoGasto = "presupuestado" | "aprobado" | "pagado";

export interface IngresoRow {
  id: string;
  fuente: FuenteIngreso;
  concepto: string;
  monto: number;
  estado: EstadoIngreso;
  fecha: string;
}
export interface GastoRow {
  id: string;
  categoria: CategoriaGasto;
  concepto: string;
  monto: number;
  proveedor: string | null;
  estado: EstadoGasto;
  area: string | null;
}
export interface PresupuestoRow {
  id: string;
  categoria: CategoriaGasto;
  monto_asignado: number;
}
export interface AreaOpcion {
  slug: string;
  label: string;
}

const FUENTES: FuenteIngreso[] = [
  "boleteria",
  "stands",
  "patrocinios",
  "otros",
];
const CATEGORIAS: CategoriaGasto[] = [
  "produccion",
  "logistica",
  "marketing",
  "talento",
  "tecnologia",
  "alianzas",
  "otros",
];

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const num = (v: number) => Number(v) || 0;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function FinanzasDashboard({
  ingresos,
  gastos,
  presupuesto,
  areasEditables,
  esAdmin,
  puedeEditar,
}: {
  ingresos: IngresoRow[];
  gastos: GastoRow[];
  presupuesto: PresupuestoRow[];
  areasEditables: AreaOpcion[];
  esAdmin: boolean;
  puedeEditar: boolean;
}) {
  const confirmados = ingresos
    .filter((i) => i.estado !== "proyectado")
    .reduce((s, i) => s + num(i.monto), 0);
  const proyectados = ingresos
    .filter((i) => i.estado === "proyectado")
    .reduce((s, i) => s + num(i.monto), 0);
  const pagados = gastos
    .filter((g) => g.estado === "pagado")
    .reduce((s, g) => s + num(g.monto), 0);
  const balance = confirmados - pagados;

  const porFuente = FUENTES.map((f) => ({
    fuente: f,
    total: ingresos
      .filter((i) => i.fuente === f && i.estado !== "proyectado")
      .reduce((s, i) => s + num(i.monto), 0),
  })).filter((x) => x.total > 0);

  const presByCat = new Map(
    presupuesto.map((p) => [p.categoria, num(p.monto_asignado)]),
  );
  const porCategoria = CATEGORIAS.map((c) => ({
    categoria: c,
    gastado: gastos
      .filter((g) => g.categoria === c && g.estado === "pagado")
      .reduce((s, g) => s + num(g.monto), 0),
    asignado: presByCat.get(c) ?? 0,
  })).filter((x) => x.gastado > 0 || x.asignado > 0);

  const hoy = new Date().toISOString().slice(0, 10);
  const pendientesCobro = ingresos.filter((i) => i.estado === "proyectado");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-sm text-muted">
          Ingresos, gastos y presupuesto de Feria Effix 2026.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Ingresos confirmados" valor={cop(confirmados)} tono="ok" />
        <Kpi label="Ingresos proyectados" valor={cop(proyectados)} />
        <Kpi label="Gastos pagados" valor={cop(pagados)} tono="danger" />
        <Kpi
          label="Balance neto"
          valor={cop(balance)}
          tono={balance >= 0 ? "ok" : "danger"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card titulo="Ingresos confirmados por fuente">
          {porFuente.length === 0 ? (
            <Vacio />
          ) : (
            <div className="space-y-3">
              {porFuente.map((x) => (
                <Barra
                  key={x.fuente}
                  label={cap(x.fuente)}
                  valor={x.total}
                  max={Math.max(...porFuente.map((y) => y.total))}
                  texto={cop(x.total)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card titulo="Gastos pagados vs. presupuesto">
          {porCategoria.length === 0 ? (
            <Vacio />
          ) : (
            <div className="space-y-3">
              {porCategoria.map((x) => (
                <div key={x.categoria}>
                  <div className="flex justify-between text-xs">
                    <span>{cap(x.categoria)}</span>
                    <span className="text-muted">
                      {cop(x.gastado)} / {cop(x.asignado)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className={`h-full ${x.asignado && x.gastado > x.asignado ? "bg-danger" : "bg-brand"}`}
                      style={{
                        width: `${x.asignado ? Math.min(100, (x.gastado / x.asignado) * 100) : 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card titulo="Pagos pendientes de cobro (proyectados)">
        {pendientesCobro.length === 0 ? (
          <Vacio texto="Sin pagos pendientes." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="pb-2 font-medium">Concepto</th>
                <th className="pb-2 font-medium">Fuente</th>
                <th className="pb-2 font-medium">Fecha</th>
                <th className="pb-2 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {pendientesCobro.map((i) => (
                <tr key={i.id} className="border-b border-border/60">
                  <td className="py-2">{i.concepto}</td>
                  <td className="py-2 text-muted">{cap(i.fuente)}</td>
                  <td
                    className={`py-2 ${i.fecha < hoy ? "text-danger" : "text-muted"}`}
                  >
                    {i.fecha}
                    {i.fecha < hoy && " · vencido"}
                  </td>
                  <td className="py-2 text-right">{cop(num(i.monto))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {puedeEditar && (
        <div className="grid gap-6 lg:grid-cols-2">
          <FormIngreso />
          <FormGasto areas={areasEditables} />
        </div>
      )}

      <Card titulo="Gastos">
        <GastosTabla gastos={gastos} esAdmin={esAdmin} />
      </Card>
    </div>
  );
}

function GastosTabla({
  gastos,
  esAdmin,
}: {
  gastos: GastoRow[];
  esAdmin: boolean;
}) {
  const [pending, startTransition] = useTransition();
  if (gastos.length === 0) return <Vacio texto="Sin gastos registrados." />;

  const estadoStyle: Record<EstadoGasto, string> = {
    presupuestado: "text-warn",
    aprobado: "text-brand",
    pagado: "text-ok",
  };

  return (
    <table className={`w-full text-sm ${pending ? "opacity-70" : ""}`}>
      <thead>
        <tr className="border-b border-border text-left text-muted">
          <th className="pb-2 font-medium">Concepto</th>
          <th className="pb-2 font-medium">Categoría</th>
          <th className="pb-2 font-medium">Área</th>
          <th className="pb-2 text-right font-medium">Monto</th>
          <th className="pb-2 font-medium">Estado</th>
          {esAdmin && <th className="pb-2 font-medium">Acción</th>}
        </tr>
      </thead>
      <tbody>
        {gastos.map((g) => (
          <tr key={g.id} className="border-b border-border/60">
            <td className="py-2">{g.concepto}</td>
            <td className="py-2 text-muted">{cap(g.categoria)}</td>
            <td className="py-2 text-muted">{g.area ? cap(g.area) : "—"}</td>
            <td className="py-2 text-right">{cop(num(g.monto))}</td>
            <td className={`py-2 capitalize ${estadoStyle[g.estado]}`}>
              {g.estado}
            </td>
            {esAdmin && (
              <td className="py-2">
                {g.estado === "presupuestado" && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await cambiarEstadoGasto(g.id, "aprobado");
                      })
                    }
                    className="text-xs text-brand hover:underline"
                  >
                    Aprobar
                  </button>
                )}
                {g.estado === "aprobado" && (
                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await cambiarEstadoGasto(g.id, "pagado");
                      })
                    }
                    className="text-xs text-ok hover:underline"
                  >
                    Marcar pagado
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FormIngreso() {
  const [fuente, setFuente] = useState<FuenteIngreso>("boleteria");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [estado, setEstado] = useState<EstadoIngreso>("confirmado");
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (concepto.trim().length < 2) return;
    startTransition(async () => {
      const r = await registrarIngreso({
        fuente,
        concepto,
        monto: Number(monto) || 0,
        estado,
        fecha: new Date().toISOString().slice(0, 10),
      });
      if (r.ok) {
        setConcepto("");
        setMonto("");
      }
    });
  }

  return (
    <Card titulo="Registrar ingreso">
      <form onSubmit={enviar} className="space-y-3">
        <Input value={concepto} onChange={setConcepto} placeholder="Concepto" />
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={fuente}
            onChange={(v) => setFuente(v as FuenteIngreso)}
          >
            {FUENTES.map((f) => (
              <option key={f} value={f}>
                {cap(f)}
              </option>
            ))}
          </Select>
          <Select
            value={estado}
            onChange={(v) => setEstado(v as EstadoIngreso)}
          >
            <option value="proyectado">Proyectado</option>
            <option value="confirmado">Confirmado</option>
            <option value="cobrado">Cobrado</option>
          </Select>
        </div>
        <Input
          value={monto}
          onChange={setMonto}
          placeholder="Monto (COP)"
          type="number"
        />
        <Boton pending={pending}>Registrar ingreso</Boton>
      </form>
    </Card>
  );
}

function FormGasto({ areas }: { areas: AreaOpcion[] }) {
  const [categoria, setCategoria] = useState<CategoriaGasto>("produccion");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [areaSlug, setAreaSlug] = useState(areas[0]?.slug ?? "");
  const [pending, startTransition] = useTransition();

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (concepto.trim().length < 2 || !areaSlug) return;
    startTransition(async () => {
      const r = await solicitarGasto({
        categoria,
        concepto,
        monto: Number(monto) || 0,
        proveedor,
        areaSlug,
      });
      if (r.ok) {
        setConcepto("");
        setMonto("");
        setProveedor("");
      }
    });
  }

  return (
    <Card titulo="Solicitar gasto (queda presupuestado)">
      <form onSubmit={enviar} className="space-y-3">
        <Input value={concepto} onChange={setConcepto} placeholder="Concepto" />
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={categoria}
            onChange={(v) => setCategoria(v as CategoriaGasto)}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {cap(c)}
              </option>
            ))}
          </Select>
          <Select value={areaSlug} onChange={setAreaSlug}>
            {areas.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <Input
          value={proveedor}
          onChange={setProveedor}
          placeholder="Proveedor"
        />
        <Input
          value={monto}
          onChange={setMonto}
          placeholder="Monto (COP)"
          type="number"
        />
        <Boton pending={pending}>Solicitar gasto</Boton>
      </form>
    </Card>
  );
}

/* ---------- UI helpers ---------- */
function Kpi({
  label,
  valor,
  tono,
}: {
  label: string;
  valor: string;
  tono?: "ok" | "danger";
}) {
  const color =
    tono === "ok"
      ? "text-ok"
      : tono === "danger"
        ? "text-danger"
        : "text-brand";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{valor}</p>
    </div>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold text-muted">{titulo}</h2>
      {children}
    </section>
  );
}

function Barra({
  label,
  valor,
  max,
  texto,
}: {
  label: string;
  valor: number;
  max: number;
  texto: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="text-muted">{texto}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full bg-brand"
          style={{ width: `${max ? (valor / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
}

function Vacio({ texto = "Sin datos." }: { texto?: string }) {
  return <p className="py-4 text-center text-sm text-muted">{texto}</p>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
    >
      {children}
    </select>
  );
}

function Boton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
