"use client";

import { useMemo, useState, useTransition } from "react";
import { FinanzasSubnav } from "@/components/panel/FinanzasSubnav";
import {
  crearMovimientoEgreso,
  crearMovimientoIngreso,
  actualizarMovimientoEgreso,
  actualizarMovimientoIngreso,
  borrarMovimientoEgreso,
  borrarMovimientoIngreso,
  type MovimientoEgresoInput,
  type MovimientoIngresoInput,
  type NivelSensibilidad,
} from "@/app/panel/finanzas/movimientos/actions";

// ----------------------------------------------------------------------------
// Vista de /panel/finanzas/movimientos: dos libros (ingresos y egresos) ya
// filtrados por RLS del lado del servidor. Todo el filtrado de acá (fecha,
// categoría, origen, rubro, búsqueda) es sobre el conjunto de filas que el
// usuario YA puede ver — no vuelve a pedirle nada a Supabase.
//
// Crear/editar/borrar solo se renderiza si `esAdmin` (prop que viene de
// sesion.esAdmin en page.tsx, gate de UI espejo de la RLS real). Para
// cualquier otro usuario esto sigue siendo exactamente la vista de solo
// lectura de siempre.
// ----------------------------------------------------------------------------

export type OrigenIngreso = "stand" | "boleteria" | "patrocinio" | "otro";

export interface IngresoMovView {
  id: string;
  fecha_creacion: string;
  numero_factura: string | null;
  cliente_nombre: string | null;
  cliente_nit?: string; // Solo presente en el payload si sesion.esAdmin.
  concepto: string | null;
  total_neto: number;
  origen: OrigenIngreso;
  categoria_id: string | null;
  revision_pendiente: boolean;
  nota_revision: string | null;
  // Campos "de edición": solo viajan en el payload si sesion.esAdmin (mismo
  // criterio que cliente_nit) porque solo el formulario de crear/editar los
  // usa, y ese formulario solo lo ve sesion.esAdmin.
  total_bruto?: number | null;
  descuentos?: number | null;
  subtotal?: number | null;
  impuestos?: number | null;
  subido_a_effisystems?: boolean;
  nivel_sensibilidad?: NivelSensibilidad;
}

export interface EgresoMovView {
  id: string;
  fecha: string | null;
  proveedor_nombre: string | null;
  rubro_agrupado: string | null;
  subrubro: string | null;
  total_neto: number;
  numero_factura_proveedor: string | null;
  revision_pendiente: boolean;
  nota_revision: string | null;
  // Campos "de edición": ídem ingresos, solo presentes si sesion.esAdmin.
  descripcion_servicio?: string | null;
  observaciones?: string | null;
  valor_antes_iva?: number | null;
  impuestos?: number | null;
  retenciones?: number | null;
  numero_comprobante_effi?: string | null;
  lleva_factura_electronica?: boolean;
  categoria_id?: string | null;
  nivel_sensibilidad?: NivelSensibilidad;
}

export interface CategoriaOpcion {
  id: string;
  nombre: string;
  tipo: "ingreso" | "egreso";
}

const ORIGEN_LABEL: Record<OrigenIngreso, string> = {
  stand: "Stand",
  boleteria: "Boletería",
  patrocinio: "Patrocinio",
  otro: "Otro",
};

const NIVEL_SENSIBILIDAD_LABEL: Record<NivelSensibilidad, string> = {
  resumen: "Resumen",
  detalle: "Detalle",
  personal: "Personal",
};

const NIVEL_SENSIBILIDAD_DESC: Record<NivelSensibilidad, string> = {
  resumen: "Visible en agregados y dashboards — el mínimo detalle.",
  detalle:
    "Visible para admin y finanzas_operativo con acceso al área (proveedor/cliente, monto, factura).",
  personal:
    "El más sensible — NITs, datos bancarios, nómina individual. Solo admin.",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtFecha = (f: string | null) => {
  if (!f) return "—";
  const d = new Date(`${f}T00:00:00`);
  if (Number.isNaN(d.getTime())) return f;
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export function MovimientosFinanzas({
  ingresos,
  egresos,
  categorias,
  sumaRevisionIngresos,
  sumaRevisionEgresos,
  esAdmin,
}: {
  ingresos: IngresoMovView[];
  egresos: EgresoMovView[];
  categorias: CategoriaOpcion[];
  sumaRevisionIngresos: number;
  sumaRevisionEgresos: number;
  esAdmin: boolean;
}) {
  const [tab, setTab] = useState<"ingresos" | "egresos">("ingresos");

  const categoriasIngreso = useMemo(
    () => categorias.filter((c) => c.tipo === "ingreso"),
    [categorias],
  );
  const categoriasEgreso = useMemo(
    () => categorias.filter((c) => c.tipo === "egreso"),
    [categorias],
  );

  return (
    <div className="space-y-6">
      <FinanzasSubnav />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
        <p className="text-sm text-muted">
          Libro contable real de ingresos y egresos ejecutados.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <TabBtn activo={tab === "ingresos"} onClick={() => setTab("ingresos")}>
          Ingresos
        </TabBtn>
        <TabBtn activo={tab === "egresos"} onClick={() => setTab("egresos")}>
          Egresos
        </TabBtn>
      </div>

      {tab === "ingresos" ? (
        <TablaIngresos
          ingresos={ingresos}
          categorias={categoriasIngreso}
          sumaRevision={sumaRevisionIngresos}
          esAdmin={esAdmin}
        />
      ) : (
        <TablaEgresos
          egresos={egresos}
          categorias={categoriasEgreso}
          sumaRevision={sumaRevisionEgresos}
          esAdmin={esAdmin}
        />
      )}
    </div>
  );
}

function TabBtn({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        activo
          ? "border-brand text-brand"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ---------- Aviso de revisión pendiente -------------------------------------

function AvisoRevision({ suma, cantidad }: { suma: number; cantidad: number }) {
  if (cantidad === 0) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warn/40 bg-warn/10 px-4 py-2.5 text-sm text-warn">
      <IconoAdvertencia className="h-4 w-4 shrink-0" />
      <span>
        <strong className="font-semibold">{fmtCOP(suma)}</strong> en revisión,
        no confirmados — ver nota en cada uno.
      </span>
    </div>
  );
}

function IconoAdvertencia({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function RevisionBadge({ nota }: { nota: string | null }) {
  return (
    <span className="group relative inline-flex">
      <IconoAdvertencia className="h-4 w-4 cursor-help text-warn" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-56 -translate-x-1/2 rounded-md border border-border bg-surface-2 p-2 text-xs font-normal text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {nota?.trim() || "Pendiente de revisión."}
      </span>
    </span>
  );
}

// ---------- Ingresos ---------------------------------------------------------

function TablaIngresos({
  ingresos,
  categorias,
  sumaRevision,
  esAdmin,
}: {
  ingresos: IngresoMovView[];
  categorias: CategoriaOpcion[];
  sumaRevision: number;
  esAdmin: boolean;
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [categoriaId, setCategoriaId] = useState("todas");
  const [origen, setOrigen] = useState<"todos" | OrigenIngreso>("todos");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState<
    { modo: "crear" } | { modo: "editar"; ingreso: IngresoMovView } | null
  >(null);
  const [borrando, setBorrando] = useState<IngresoMovView | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return ingresos.filter((m) => {
      if (desde && m.fecha_creacion < desde) return false;
      if (hasta && m.fecha_creacion > hasta) return false;
      if (categoriaId !== "todas" && m.categoria_id !== categoriaId)
        return false;
      if (origen !== "todos" && m.origen !== origen) return false;
      if (q && !(m.cliente_nombre ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [ingresos, desde, hasta, categoriaId, origen, busqueda]);

  const pendientes = ingresos.filter((m) => m.revision_pendiente).length;

  const colSpan = esAdmin ? 9 : 7;

  return (
    <div className="space-y-4">
      <AvisoRevision suma={sumaRevision} cantidad={pendientes} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <Campo label="Desde">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputCls}
            />
          </Campo>
          <Campo label="Hasta">
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputCls}
            />
          </Campo>
          <Campo label="Categoría">
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className={inputCls}
            >
              <option value="todas">Todas</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Origen">
            <select
              value={origen}
              onChange={(e) => setOrigen(e.target.value as typeof origen)}
              className={inputCls}
            >
              <option value="todos">Todos</option>
              {(Object.keys(ORIGEN_LABEL) as OrigenIngreso[]).map((o) => (
                <option key={o} value={o}>
                  {ORIGEN_LABEL[o]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Buscar cliente" className="min-w-[14rem] flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre del cliente…"
              className={inputCls}
            />
          </Campo>
        </div>

        {esAdmin && (
          <button
            onClick={() => setModalAbierto({ modo: "crear" })}
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            + Nuevo ingreso
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">N.º factura</th>
              <th className="p-3 font-medium">Cliente</th>
              {esAdmin && <th className="p-3 font-medium">NIT</th>}
              <th className="p-3 font-medium">Concepto</th>
              <th className="p-3 font-medium">Total neto</th>
              <th className="p-3 font-medium">Origen</th>
              <th className="p-3 font-medium"></th>
              {esAdmin && <th className="p-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="p-6 text-center text-muted">
                  No hay ingresos que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtrados.map((m) => (
              <tr key={m.id} className="border-b border-border/60">
                <td className="p-3 whitespace-nowrap">
                  {fmtFecha(m.fecha_creacion)}
                </td>
                <td className="p-3 text-muted">{m.numero_factura ?? "—"}</td>
                <td className="p-3 font-medium">{m.cliente_nombre ?? "—"}</td>
                {esAdmin && (
                  <td className="p-3 text-muted">{m.cliente_nit ?? "—"}</td>
                )}
                <td className="p-3 text-muted">{m.concepto ?? "—"}</td>
                <td className="p-3 font-medium whitespace-nowrap">
                  {fmtCOP(m.total_neto)}
                </td>
                <td className="p-3">
                  <span className="rounded-full border border-brand/40 bg-brand-soft/20 px-2 py-0.5 text-xs text-brand">
                    {ORIGEN_LABEL[m.origen]}
                  </span>
                </td>
                <td className="p-3">
                  {m.revision_pendiente && (
                    <RevisionBadge nota={m.nota_revision} />
                  )}
                </td>
                {esAdmin && (
                  <td className="p-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        onClick={() =>
                          setModalAbierto({ modo: "editar", ingreso: m })
                        }
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setBorrando(m)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-danger hover:border-danger"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {filtrados.length} de {ingresos.length} movimientos
      </p>

      {esAdmin && modalAbierto && (
        <IngresoFormModal
          inicial={modalAbierto.modo === "editar" ? modalAbierto.ingreso : null}
          categorias={categorias}
          onCerrar={() => setModalAbierto(null)}
        />
      )}

      {esAdmin && borrando && (
        <ConfirmarBorradoModal
          titulo="Borrar movimiento de ingreso"
          descripcion={`${fmtFecha(borrando.fecha_creacion)} · ${
            borrando.cliente_nombre ?? "Sin cliente"
          } · ${fmtCOP(borrando.total_neto)}`}
          onCancelar={() => setBorrando(null)}
          onConfirmar={async () => {
            const r = await borrarMovimientoIngreso(borrando.id);
            if (r.ok) setBorrando(null);
            return r;
          }}
        />
      )}
    </div>
  );
}

// ---------- Egresos -----------------------------------------------------------

function TablaEgresos({
  egresos,
  categorias,
  sumaRevision,
  esAdmin,
}: {
  egresos: EgresoMovView[];
  categorias: CategoriaOpcion[];
  sumaRevision: number;
  esAdmin: boolean;
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [rubro, setRubro] = useState("todos");
  const [subrubro, setSubrubro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState<
    { modo: "crear" } | { modo: "editar"; egreso: EgresoMovView } | null
  >(null);
  const [borrando, setBorrando] = useState<EgresoMovView | null>(null);

  const rubros = useMemo(
    () =>
      Array.from(
        new Set(egresos.map((e) => e.rubro_agrupado).filter(Boolean)),
      ).sort() as string[],
    [egresos],
  );
  const subrubros = useMemo(
    () =>
      Array.from(
        new Set(egresos.map((e) => e.subrubro).filter(Boolean)),
      ).sort() as string[],
    [egresos],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return egresos.filter((e) => {
      if (desde && (!e.fecha || e.fecha < desde)) return false;
      if (hasta && (!e.fecha || e.fecha > hasta)) return false;
      if (rubro !== "todos" && e.rubro_agrupado !== rubro) return false;
      if (subrubro !== "todos" && e.subrubro !== subrubro) return false;
      if (q && !(e.proveedor_nombre ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [egresos, desde, hasta, rubro, subrubro, busqueda]);

  const pendientes = egresos.filter((e) => e.revision_pendiente).length;

  const colSpan = esAdmin ? 8 : 7;

  return (
    <div className="space-y-4">
      <AvisoRevision suma={sumaRevision} cantidad={pendientes} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
          <Campo label="Desde">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={inputCls}
            />
          </Campo>
          <Campo label="Hasta">
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={inputCls}
            />
          </Campo>
          <Campo label="Rubro">
            <select
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              className={inputCls}
            >
              <option value="todos">Todos</option>
              {rubros.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Subrubro">
            <select
              value={subrubro}
              onChange={(e) => setSubrubro(e.target.value)}
              className={inputCls}
            >
              <option value="todos">Todos</option>
              {subrubros.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Buscar proveedor" className="min-w-[14rem] flex-1">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre del proveedor…"
              className={inputCls}
            />
          </Campo>
        </div>

        {esAdmin && (
          <button
            onClick={() => setModalAbierto({ modo: "crear" })}
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
          >
            + Nuevo egreso
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Fecha</th>
              <th className="p-3 font-medium">Proveedor</th>
              <th className="p-3 font-medium">Rubro</th>
              <th className="p-3 font-medium">Subrubro</th>
              <th className="p-3 font-medium">Total neto</th>
              <th className="p-3 font-medium">N.º factura proveedor</th>
              <th className="p-3 font-medium"></th>
              {esAdmin && <th className="p-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="p-6 text-center text-muted">
                  No hay egresos que coincidan con los filtros.
                </td>
              </tr>
            )}
            {filtrados.map((e) => (
              <tr key={e.id} className="border-b border-border/60">
                <td className="p-3 whitespace-nowrap">{fmtFecha(e.fecha)}</td>
                <td className="p-3 font-medium">{e.proveedor_nombre ?? "—"}</td>
                <td className="p-3 text-muted">{e.rubro_agrupado ?? "—"}</td>
                <td className="p-3 text-muted">{e.subrubro ?? "—"}</td>
                <td className="p-3 font-medium whitespace-nowrap">
                  {fmtCOP(e.total_neto)}
                </td>
                <td className="p-3 text-muted">
                  {e.numero_factura_proveedor ?? "—"}
                </td>
                <td className="p-3">
                  {e.revision_pendiente && (
                    <RevisionBadge nota={e.nota_revision} />
                  )}
                </td>
                {esAdmin && (
                  <td className="p-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        onClick={() =>
                          setModalAbierto({ modo: "editar", egreso: e })
                        }
                        className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setBorrando(e)}
                        className="rounded-md border border-border px-2 py-1 text-xs text-danger hover:border-danger"
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {filtrados.length} de {egresos.length} movimientos
      </p>

      {esAdmin && modalAbierto && (
        <EgresoFormModal
          inicial={modalAbierto.modo === "editar" ? modalAbierto.egreso : null}
          categorias={categorias}
          rubrosSugeridos={rubros}
          subrubrosSugeridos={subrubros}
          onCerrar={() => setModalAbierto(null)}
        />
      )}

      {esAdmin && borrando && (
        <ConfirmarBorradoModal
          titulo="Borrar movimiento de egreso"
          descripcion={`${fmtFecha(borrando.fecha)} · ${
            borrando.proveedor_nombre ?? "Sin proveedor"
          } · ${fmtCOP(borrando.total_neto)}`}
          onCancelar={() => setBorrando(null)}
          onConfirmar={async () => {
            const r = await borrarMovimientoEgreso(borrando.id);
            if (r.ok) setBorrando(null);
            return r;
          }}
        />
      )}
    </div>
  );
}

// ---------- Confirmación de borrado (compartida) ----------------------------

function ConfirmarBorradoModal({
  titulo,
  descripcion,
  onCancelar,
  onConfirmar,
}: {
  titulo: string;
  descripcion: string;
  onCancelar: () => void;
  onConfirmar: () => Promise<{ ok: boolean; mensaje?: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const r = await onConfirmar();
      if (!r.ok) setError(r.mensaje ?? "No se pudo borrar el movimiento.");
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">{titulo}</h2>
        <p className="text-sm text-muted">{descripcion}</p>
        <p className="text-sm text-foreground">
          Esta acción no se puede deshacer. ¿Confirmás que querés borrarlo?
        </p>

        {error && (
          <p className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-brand hover:text-brand"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirmar}
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-60"
          >
            {pending ? "Borrando…" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Formulario: crear/editar ingreso ---------------------------------

function ingresoInputVacio(): MovimientoIngresoInput {
  return {
    fecha_creacion: new Date().toISOString().slice(0, 10),
    numero_factura: "",
    cliente_nombre: "",
    cliente_nit: "",
    concepto: "",
    total_bruto: null,
    descuentos: null,
    subtotal: null,
    impuestos: null,
    total_neto: null,
    categoria_id: null,
    origen: "otro",
    subido_a_effisystems: false,
    nivel_sensibilidad: "detalle",
    revision_pendiente: false,
    nota_revision: "",
  };
}

function ingresoInputDesde(m: IngresoMovView): MovimientoIngresoInput {
  return {
    fecha_creacion: m.fecha_creacion,
    numero_factura: m.numero_factura ?? "",
    cliente_nombre: m.cliente_nombre ?? "",
    cliente_nit: m.cliente_nit ?? "",
    concepto: m.concepto ?? "",
    total_bruto: m.total_bruto ?? null,
    descuentos: m.descuentos ?? null,
    subtotal: m.subtotal ?? null,
    impuestos: m.impuestos ?? null,
    total_neto: m.total_neto ?? null,
    categoria_id: m.categoria_id ?? null,
    origen: m.origen,
    subido_a_effisystems: m.subido_a_effisystems ?? false,
    nivel_sensibilidad: m.nivel_sensibilidad ?? "detalle",
    revision_pendiente: m.revision_pendiente,
    nota_revision: m.nota_revision ?? "",
  };
}

function IngresoFormModal({
  inicial,
  categorias,
  onCerrar,
}: {
  inicial: IngresoMovView | null;
  categorias: CategoriaOpcion[];
  onCerrar: () => void;
}) {
  const esEdicion = inicial != null;
  const [form, setForm] = useState<MovimientoIngresoInput>(() =>
    inicial ? ingresoInputDesde(inicial) : ingresoInputVacio(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof MovimientoIngresoInput>(
    campo: K,
    valor: MovimientoIngresoInput[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function calcular() {
    const bruto = Number(form.total_bruto) || 0;
    const descuentos = Number(form.descuentos) || 0;
    const impuestos = Number(form.impuestos) || 0;
    const subtotal = Math.round((bruto - descuentos) * 100) / 100;
    const totalNeto = Math.round((subtotal + impuestos) * 100) / 100;
    setForm((prev) => ({ ...prev, subtotal, total_neto: totalNeto }));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.fecha_creacion) {
      setError("La fecha es obligatoria.");
      return;
    }

    startTransition(async () => {
      const r = esEdicion
        ? await actualizarMovimientoIngreso(inicial!.id, form)
        : await crearMovimientoIngreso(form);
      if (r.ok) {
        onCerrar();
      } else {
        setError(
          r.mensaje ??
            `No se pudo ${esEdicion ? "actualizar" : "crear"} el ingreso.`,
        );
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <form
        onSubmit={guardar}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {esEdicion ? "Editar ingreso" : "Nuevo ingreso"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha *">
            <input
              type="date"
              value={form.fecha_creacion}
              onChange={(e) => set("fecha_creacion", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
          <Campo label="N.º factura">
            <input
              value={form.numero_factura ?? ""}
              onChange={(e) => set("numero_factura", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
          <Campo label="Cliente">
            <input
              value={form.cliente_nombre ?? ""}
              onChange={(e) => set("cliente_nombre", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
          <Campo label="NIT del cliente">
            <input
              value={form.cliente_nit ?? ""}
              onChange={(e) => set("cliente_nit", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
        </div>

        <Campo label="Concepto">
          <input
            value={form.concepto ?? ""}
            onChange={(e) => set("concepto", e.target.value)}
            className={inputBlockCls}
          />
        </Campo>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Montos</span>
            <button
              type="button"
              onClick={calcular}
              title="Calcular subtotal (bruto − descuentos) y total neto (subtotal + impuestos)"
              className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
            >
              Calcular subtotal y total neto
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Campo label="Total bruto">
              <input
                type="number"
                step="0.01"
                value={form.total_bruto ?? ""}
                onChange={(e) =>
                  set(
                    "total_bruto",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Descuentos">
              <input
                type="number"
                step="0.01"
                value={form.descuentos ?? ""}
                onChange={(e) =>
                  set(
                    "descuentos",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Impuestos">
              <input
                type="number"
                step="0.01"
                value={form.impuestos ?? ""}
                onChange={(e) =>
                  set(
                    "impuestos",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Subtotal">
              <input
                type="number"
                step="0.01"
                value={form.subtotal ?? ""}
                onChange={(e) =>
                  set(
                    "subtotal",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Total neto" className="col-span-2">
              <input
                type="number"
                step="0.01"
                value={form.total_neto ?? ""}
                onChange={(e) =>
                  set(
                    "total_neto",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
          </div>
          <p className="pt-1 text-[11px] text-muted">
            El botón sugiere valores (bruto − descuentos, + impuestos), pero
            quedan editables: no todo movimiento sigue la misma fórmula.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Categoría">
            <select
              value={form.categoria_id ?? ""}
              onChange={(e) => set("categoria_id", e.target.value || null)}
              className={inputBlockCls}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Origen">
            <select
              value={form.origen}
              onChange={(e) => set("origen", e.target.value as OrigenIngreso)}
              className={inputBlockCls}
            >
              {(Object.keys(ORIGEN_LABEL) as OrigenIngreso[]).map((o) => (
                <option key={o} value={o}>
                  {ORIGEN_LABEL[o]}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo label="Nivel de sensibilidad">
          <select
            value={form.nivel_sensibilidad}
            onChange={(e) =>
              set("nivel_sensibilidad", e.target.value as NivelSensibilidad)
            }
            className={inputBlockCls}
          >
            {(Object.keys(NIVEL_SENSIBILIDAD_LABEL) as NivelSensibilidad[]).map(
              (n) => (
                <option key={n} value={n}>
                  {NIVEL_SENSIBILIDAD_LABEL[n]}
                </option>
              ),
            )}
          </select>
          <span className="block pt-1 text-[11px] text-muted">
            {NIVEL_SENSIBILIDAD_DESC[form.nivel_sensibilidad]}
          </span>
        </Campo>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.subido_a_effisystems}
            onChange={(e) => set("subido_a_effisystems", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          Ya subido a Effisystems
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.revision_pendiente}
            onChange={(e) => set("revision_pendiente", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          En revisión (no confirmado)
        </label>

        {form.revision_pendiente && (
          <Campo label="Nota de revisión">
            <textarea
              value={form.nota_revision ?? ""}
              onChange={(e) => set("nota_revision", e.target.value)}
              rows={2}
              className={inputBlockCls}
            />
          </Campo>
        )}

        {error && (
          <p className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-brand hover:text-brand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {pending
              ? "Guardando…"
              : esEdicion
                ? "Guardar cambios"
                : "Crear ingreso"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Formulario: crear/editar egreso -----------------------------------

function egresoInputVacio(): MovimientoEgresoInput {
  return {
    fecha: new Date().toISOString().slice(0, 10),
    proveedor_nombre: "",
    descripcion_servicio: "",
    observaciones: "",
    rubro_agrupado: "",
    subrubro: "",
    valor_antes_iva: null,
    impuestos: null,
    retenciones: null,
    total_neto: null,
    numero_factura_proveedor: "",
    numero_comprobante_effi: "",
    lleva_factura_electronica: false,
    categoria_id: null,
    nivel_sensibilidad: "detalle",
    revision_pendiente: false,
    nota_revision: "",
  };
}

function egresoInputDesde(e: EgresoMovView): MovimientoEgresoInput {
  return {
    fecha: e.fecha ?? "",
    proveedor_nombre: e.proveedor_nombre ?? "",
    descripcion_servicio: e.descripcion_servicio ?? "",
    observaciones: e.observaciones ?? "",
    rubro_agrupado: e.rubro_agrupado ?? "",
    subrubro: e.subrubro ?? "",
    valor_antes_iva: e.valor_antes_iva ?? null,
    impuestos: e.impuestos ?? null,
    retenciones: e.retenciones ?? null,
    total_neto: e.total_neto ?? null,
    numero_factura_proveedor: e.numero_factura_proveedor ?? "",
    numero_comprobante_effi: e.numero_comprobante_effi ?? "",
    lleva_factura_electronica: e.lleva_factura_electronica ?? false,
    categoria_id: e.categoria_id ?? null,
    nivel_sensibilidad: e.nivel_sensibilidad ?? "detalle",
    revision_pendiente: e.revision_pendiente,
    nota_revision: e.nota_revision ?? "",
  };
}

const RUBROS_SUGERIDOS_BASE = [
  "Nómina Equipo",
  "Bienestar laboral",
  "Pauta Publicitaria",
  "Impuestos",
];

function EgresoFormModal({
  inicial,
  categorias,
  rubrosSugeridos,
  subrubrosSugeridos,
  onCerrar,
}: {
  inicial: EgresoMovView | null;
  categorias: CategoriaOpcion[];
  rubrosSugeridos: string[];
  subrubrosSugeridos: string[];
  onCerrar: () => void;
}) {
  const esEdicion = inicial != null;
  const [form, setForm] = useState<MovimientoEgresoInput>(() =>
    inicial ? egresoInputDesde(inicial) : egresoInputVacio(),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const rubros = useMemo(
    () => Array.from(new Set([...RUBROS_SUGERIDOS_BASE, ...rubrosSugeridos])),
    [rubrosSugeridos],
  );

  function set<K extends keyof MovimientoEgresoInput>(
    campo: K,
    valor: MovimientoEgresoInput[K],
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function calcular() {
    const valorAntesIva = Number(form.valor_antes_iva) || 0;
    const impuestos = Number(form.impuestos) || 0;
    const retenciones = Number(form.retenciones) || 0;
    const totalNeto =
      Math.round((valorAntesIva + impuestos - retenciones) * 100) / 100;
    setForm((prev) => ({ ...prev, total_neto: totalNeto }));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const r = esEdicion
        ? await actualizarMovimientoEgreso(inicial!.id, form)
        : await crearMovimientoEgreso(form);
      if (r.ok) {
        onCerrar();
      } else {
        setError(
          r.mensaje ??
            `No se pudo ${esEdicion ? "actualizar" : "crear"} el egreso.`,
        );
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <form
        onSubmit={guardar}
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {esEdicion ? "Editar egreso" : "Nuevo egreso"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha">
            <input
              type="date"
              value={form.fecha ?? ""}
              onChange={(e) => set("fecha", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
          <Campo label="Proveedor">
            <input
              value={form.proveedor_nombre ?? ""}
              onChange={(e) => set("proveedor_nombre", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
        </div>

        <Campo label="Descripción del servicio">
          <input
            value={form.descripcion_servicio ?? ""}
            onChange={(e) => set("descripcion_servicio", e.target.value)}
            className={inputBlockCls}
          />
        </Campo>

        <Campo label="Observaciones">
          <textarea
            value={form.observaciones ?? ""}
            onChange={(e) => set("observaciones", e.target.value)}
            rows={2}
            className={inputBlockCls}
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Rubro agrupado">
            <input
              list="rubros-sugeridos"
              value={form.rubro_agrupado ?? ""}
              onChange={(e) => set("rubro_agrupado", e.target.value)}
              className={inputBlockCls}
            />
            <datalist id="rubros-sugeridos">
              {rubros.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Campo>
          <Campo label="Subrubro">
            <input
              list="subrubros-sugeridos"
              value={form.subrubro ?? ""}
              onChange={(e) => set("subrubro", e.target.value)}
              className={inputBlockCls}
            />
            <datalist id="subrubros-sugeridos">
              {subrubrosSugeridos.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Campo>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Montos</span>
            <button
              type="button"
              onClick={calcular}
              title="Calcular total neto (valor antes de IVA + impuestos − retenciones)"
              className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
            >
              Calcular total neto
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Valor antes de IVA">
              <input
                type="number"
                step="0.01"
                value={form.valor_antes_iva ?? ""}
                onChange={(e) =>
                  set(
                    "valor_antes_iva",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Impuestos">
              <input
                type="number"
                step="0.01"
                value={form.impuestos ?? ""}
                onChange={(e) =>
                  set(
                    "impuestos",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Retenciones">
              <input
                type="number"
                step="0.01"
                value={form.retenciones ?? ""}
                onChange={(e) =>
                  set(
                    "retenciones",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
            <Campo label="Total neto">
              <input
                type="number"
                step="0.01"
                value={form.total_neto ?? ""}
                onChange={(e) =>
                  set(
                    "total_neto",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                className={inputBlockCls}
              />
            </Campo>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="N.º factura proveedor">
            <input
              value={form.numero_factura_proveedor ?? ""}
              onChange={(e) => set("numero_factura_proveedor", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
          <Campo label="N.º comprobante Effi">
            <input
              value={form.numero_comprobante_effi ?? ""}
              onChange={(e) => set("numero_comprobante_effi", e.target.value)}
              className={inputBlockCls}
            />
          </Campo>
        </div>

        <Campo label="Categoría">
          <select
            value={form.categoria_id ?? ""}
            onChange={(e) => set("categoria_id", e.target.value || null)}
            className={inputBlockCls}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Nivel de sensibilidad">
          <select
            value={form.nivel_sensibilidad}
            onChange={(e) =>
              set("nivel_sensibilidad", e.target.value as NivelSensibilidad)
            }
            className={inputBlockCls}
          >
            {(Object.keys(NIVEL_SENSIBILIDAD_LABEL) as NivelSensibilidad[]).map(
              (n) => (
                <option key={n} value={n}>
                  {NIVEL_SENSIBILIDAD_LABEL[n]}
                </option>
              ),
            )}
          </select>
          <span className="block pt-1 text-[11px] text-muted">
            {NIVEL_SENSIBILIDAD_DESC[form.nivel_sensibilidad]}
          </span>
        </Campo>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.lleva_factura_electronica}
            onChange={(e) => set("lleva_factura_electronica", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          Lleva factura electrónica
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.revision_pendiente}
            onChange={(e) => set("revision_pendiente", e.target.checked)}
            className="h-4 w-4 rounded border-border accent-brand"
          />
          En revisión (no confirmado)
        </label>

        {form.revision_pendiente && (
          <Campo label="Nota de revisión">
            <textarea
              value={form.nota_revision ?? ""}
              onChange={(e) => set("nota_revision", e.target.value)}
              rows={2}
              className={inputBlockCls}
            />
          </Campo>
        )}

        {error && (
          <p className="rounded-md border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:border-brand hover:text-brand"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {pending
              ? "Guardando…"
              : esEdicion
                ? "Guardar cambios"
                : "Crear egreso"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------- Helpers de UI compartidos ---------------------------------------

const inputCls =
  "rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand";

const inputBlockCls =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand";

function Campo({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`flex flex-col gap-1 text-xs text-muted ${className ?? ""}`}
    >
      {label}
      {children}
    </label>
  );
}
