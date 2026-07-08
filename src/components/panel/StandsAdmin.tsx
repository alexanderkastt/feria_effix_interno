"use client";

import { useMemo, useState, useTransition } from "react";
import {
  cambiarEstadoStand,
  crearStand,
  desfusionarStand,
  fusionarStands,
  vincularPatrocinador,
  type NuevoStandInput,
} from "@/app/panel/stands/actions";
import { StandAvatar } from "@/components/StandAvatar";
import { StandDetalle } from "@/components/panel/StandDetalle";
import { StandsDevoluciones } from "@/components/panel/StandsDevoluciones";
import type { DevolucionView } from "@/components/panel/StandsDevoluciones";
import {
  Campo,
  PrecioStandEditor,
  usePrecioStand,
} from "@/components/panel/stands-precio";
import {
  CATEGORIA_LABEL,
  ESTADO_VENTA_LABEL,
  ESTADO_VENTA_STYLE,
  FRECUENCIA_LABEL,
  PABELLON_LABEL,
  TIPO_STAND_LABEL,
  fmtCOP,
  formatearTamano,
  type AsesorOption,
  type CategoriaCliente,
  type EstadoVenta,
  type FrecuenciaParticipacion,
  type Pabellon,
  type PagoStandView,
  type PatrocinioOption,
  type StandView,
  type TipoStand,
} from "@/components/panel/stands-shared";

export * from "@/components/panel/stands-shared";

const PABELLONES = Object.keys(PABELLON_LABEL) as Pabellon[];
const FRECUENCIAS = Object.keys(FRECUENCIA_LABEL) as FrecuenciaParticipacion[];
const TIPOS_STAND = Object.keys(TIPO_STAND_LABEL) as TipoStand[];
const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as CategoriaCliente[];
const ESTADOS_VENTA = Object.keys(ESTADO_VENTA_LABEL) as EstadoVenta[];

const ESTADOS: StandView["estado"][] = [
  "disponible",
  "bloqueado_temporal",
  "reservado",
  "vendido",
];

const ESTADO_LABEL: Record<StandView["estado"], string> = {
  disponible: "Disponible",
  bloqueado_temporal: "Bloqueado",
  reservado: "Reservado",
  vendido: "Vendido",
};

type Tab = "stands" | "devoluciones";

export function StandsAdmin({
  stands,
  patrocinios,
  pagos,
  devoluciones,
  asesores,
  puedeEditar,
  puedeEditarComercial,
}: {
  stands: StandView[];
  patrocinios: PatrocinioOption[];
  pagos: PagoStandView[];
  devoluciones: DevolucionView[];
  asesores: AsesorOption[];
  puedeEditar: boolean;
  puedeEditarComercial: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("stands");
  const [seleccionado, setSeleccionado] = useState<StandView | null>(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [paraFusionar, setParaFusionar] = useState<Set<string>>(new Set());
  const [fusionAbierta, setFusionAbierta] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroPabellon, setFiltroPabellon] = useState<Pabellon | "todos">(
    "todos",
  );
  const [filtroEstado, setFiltroEstado] = useState<
    StandView["estado"] | "todos"
  >("todos");
  const [filtroEstadoVenta, setFiltroEstadoVenta] = useState<
    EstadoVenta | "todos"
  >("todos");
  const [filtroCategoria, setFiltroCategoria] = useState<
    CategoriaCliente | "todos"
  >("todos");
  const [filtroAsesor, setFiltroAsesor] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const hayFiltrosActivos =
    busqueda.trim() !== "" ||
    filtroPabellon !== "todos" ||
    filtroEstado !== "todos" ||
    filtroEstadoVenta !== "todos" ||
    filtroCategoria !== "todos" ||
    filtroAsesor !== "todos" ||
    fechaDesde !== "" ||
    fechaHasta !== "";

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroPabellon("todos");
    setFiltroEstado("todos");
    setFiltroEstadoVenta("todos");
    setFiltroCategoria("todos");
    setFiltroAsesor("todos");
    setFechaDesde("");
    setFechaHasta("");
  }

  const standsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return stands.filter((s) => {
      if (filtroPabellon !== "todos" && s.pabellon !== filtroPabellon)
        return false;
      if (filtroEstado !== "todos" && s.estado !== filtroEstado) return false;
      if (filtroEstadoVenta !== "todos" && s.estado_venta !== filtroEstadoVenta)
        return false;
      if (
        filtroCategoria !== "todos" &&
        s.categoria_cliente !== filtroCategoria
      )
        return false;
      if (filtroAsesor !== "todos" && s.asesor_id !== filtroAsesor)
        return false;
      if (fechaDesde && (!s.fecha_venta || s.fecha_venta < fechaDesde))
        return false;
      if (fechaHasta && (!s.fecha_venta || s.fecha_venta > fechaHasta))
        return false;
      if (q) {
        const texto = [
          s.codigo,
          s.nombre,
          s.cliente_nombre,
          s.nombre_fiscal,
          s.nombre_persona_encargada,
          s.ciudad,
          s.id_effi,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!texto.includes(q)) return false;
      }
      return true;
    });
  }, [
    stands,
    busqueda,
    filtroPabellon,
    filtroEstado,
    filtroEstadoVenta,
    filtroCategoria,
    filtroAsesor,
    fechaDesde,
    fechaHasta,
  ]);

  const conteo = ESTADOS.map((e) => ({
    estado: e,
    n: standsFiltrados.filter((s) => s.estado === e).length,
  }));

  const pagosPorStand = useMemo(() => {
    const mapa = new Map<string, PagoStandView[]>();
    for (const p of pagos) {
      const lista = mapa.get(p.stand_id) ?? [];
      lista.push(p);
      mapa.set(p.stand_id, lista);
    }
    return mapa;
  }, [pagos]);

  const standsPorId = useMemo(() => {
    const mapa = new Map<string, StandView>();
    for (const s of stands) mapa.set(s.id, s);
    return mapa;
  }, [stands]);

  const fusionadosPorPrincipal = useMemo(() => {
    const mapa = new Map<string, StandView[]>();
    for (const s of stands) {
      if (!s.stand_principal_id) continue;
      const lista = mapa.get(s.stand_principal_id) ?? [];
      lista.push(s);
      mapa.set(s.stand_principal_id, lista);
    }
    return mapa;
  }, [stands]);

  function alternarSeleccion(id: string) {
    setParaFusionar((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function confirmarFusion(principalId: string) {
    const secundarios = [...paraFusionar].filter((id) => id !== principalId);
    startTransition(async () => {
      const r = await fusionarStands(principalId, secundarios);
      if (r.ok) {
        setParaFusionar(new Set());
        setFusionAbierta(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stands</h1>
        <p className="text-sm text-muted">
          Control comercial y operativo de los 289 stands de la feria.
          {!puedeEditar && " Solo lectura."}
        </p>
      </div>

      <StandsKpis stands={stands} pagos={pagos} />

      <div className="flex items-center justify-between gap-2 border-b border-border">
        <div className="flex gap-2">
          <TabButton
            activo={tab === "stands"}
            onClick={() => setTab("stands")}
            label="Stands"
          />
          <TabButton
            activo={tab === "devoluciones"}
            onClick={() => setTab("devoluciones")}
            label={`Devoluciones (${devoluciones.length})`}
          />
        </div>
        {tab === "stands" && puedeEditarComercial && (
          <button
            onClick={() => setNuevoAbierto(true)}
            className="mb-2 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-strong"
          >
            + Nuevo stand
          </button>
        )}
      </div>

      {tab === "stands" ? (
        <>
          <FiltrosStands
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            filtroPabellon={filtroPabellon}
            setFiltroPabellon={setFiltroPabellon}
            filtroEstado={filtroEstado}
            setFiltroEstado={setFiltroEstado}
            filtroEstadoVenta={filtroEstadoVenta}
            setFiltroEstadoVenta={setFiltroEstadoVenta}
            filtroCategoria={filtroCategoria}
            setFiltroCategoria={setFiltroCategoria}
            filtroAsesor={filtroAsesor}
            setFiltroAsesor={setFiltroAsesor}
            fechaDesde={fechaDesde}
            setFechaDesde={setFechaDesde}
            fechaHasta={fechaHasta}
            setFechaHasta={setFechaHasta}
            asesores={asesores}
            hayFiltrosActivos={hayFiltrosActivos}
            onLimpiar={limpiarFiltros}
            total={stands.length}
            visibles={standsFiltrados.length}
          />

          <div className="grid gap-4 sm:grid-cols-4">
            {conteo.map((c) => (
              <div
                key={c.estado}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-xs text-muted">{ESTADO_LABEL[c.estado]}</p>
                <p className="mt-1 text-2xl font-bold text-brand">{c.n}</p>
              </div>
            ))}
          </div>

          {puedeEditarComercial && paraFusionar.size > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-brand bg-brand-soft/20 px-4 py-2">
              <span className="text-sm text-brand">
                {paraFusionar.size} stand{paraFusionar.size === 1 ? "" : "s"}{" "}
                seleccionado{paraFusionar.size === 1 ? "" : "s"} para fusionar
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setParaFusionar(new Set())}
                  className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  disabled={paraFusionar.size < 2}
                  onClick={() => setFusionAbierta(true)}
                  className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-50"
                >
                  Fusionar seleccionados
                </button>
              </div>
            </div>
          )}

          <div
            className={`overflow-x-auto rounded-xl border border-border bg-surface ${pending ? "opacity-70" : ""}`}
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  {puedeEditarComercial && <th className="w-8 p-3"></th>}
                  <th className="p-3 font-medium">Código</th>
                  <th className="p-3 font-medium">Ubicación</th>
                  <th className="p-3 font-medium">Pabellón</th>
                  <th className="p-3 font-medium">Tamaño</th>
                  <th className="p-3 font-medium">Precio</th>
                  <th className="p-3 font-medium">Estado</th>
                  <th className="p-3 font-medium">Estado venta</th>
                  <th className="p-3 font-medium">Cliente</th>
                  <th className="p-3 font-medium">Patrocinador</th>
                  <th className="p-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {standsFiltrados.map((s) => {
                  const hijos = fusionadosPorPrincipal.get(s.id) ?? [];
                  const principal = s.stand_principal_id
                    ? standsPorId.get(s.stand_principal_id)
                    : null;
                  return (
                    <tr key={s.id} className="border-b border-border/60">
                      {puedeEditarComercial && (
                        <td className="p-3">
                          {!s.stand_principal_id && (
                            <input
                              type="checkbox"
                              checked={paraFusionar.has(s.id)}
                              onChange={() => alternarSeleccion(s.id)}
                              className="h-4 w-4 accent-brand"
                            />
                          )}
                        </td>
                      )}
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <StandAvatar
                            logoUrl={s.logo_url}
                            nombre={s.nombre}
                            size={24}
                          />
                          <div>
                            {s.codigo}
                            {hijos.length > 0 && (
                              <span className="ml-2 rounded-full border border-brand/50 bg-brand-soft/20 px-1.5 py-0.5 text-[10px] font-normal text-brand">
                                +{hijos.length} fusionado
                                {hijos.length === 1 ? "" : "s"}
                              </span>
                            )}
                            {principal && (
                              <p className="mt-0.5 text-[11px] font-normal text-muted">
                                ↳ fusionado con {principal.codigo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-muted">{s.nombre ?? "—"}</td>
                      <td className="p-3 text-muted">
                        {s.pabellon ? PABELLON_LABEL[s.pabellon] : "—"}
                      </td>
                      <td className="p-3 text-muted">{s.tamano ?? "—"}</td>
                      <td className="p-3">{fmtCOP(s.precio)}</td>
                      <td className="p-3">
                        {puedeEditar ? (
                          <select
                            value={s.estado}
                            disabled={pending}
                            onChange={(e) => {
                              const nuevo = e.target
                                .value as StandView["estado"];
                              startTransition(async () => {
                                await cambiarEstadoStand(s.id, nuevo);
                              });
                            }}
                            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                          >
                            {ESTADOS.map((e) => (
                              <option key={e} value={e}>
                                {ESTADO_LABEL[e]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          ESTADO_LABEL[s.estado]
                        )}
                      </td>
                      <td className="p-3">
                        {s.estado_venta ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_VENTA_STYLE[s.estado_venta]}`}
                          >
                            {ESTADO_VENTA_LABEL[s.estado_venta]}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="p-3 text-muted">
                        {s.cliente_nombre ?? "—"}
                      </td>
                      <td className="p-3">
                        {puedeEditar ? (
                          <select
                            value={s.patrocinador_id ?? ""}
                            disabled={pending}
                            onChange={(e) => {
                              const pid = e.target.value || null;
                              startTransition(async () => {
                                await vincularPatrocinador(s.id, pid);
                              });
                            }}
                            className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                          >
                            <option value="">— Sin patrocinador —</option>
                            {patrocinios.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.empresa}
                              </option>
                            ))}
                          </select>
                        ) : (
                          (patrocinios.find((p) => p.id === s.patrocinador_id)
                            ?.empresa ?? "—")
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSeleccionado(s)}
                            className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
                          >
                            Ver detalle
                          </button>
                          {puedeEditarComercial && s.stand_principal_id && (
                            <button
                              disabled={pending}
                              onClick={() =>
                                startTransition(async () => {
                                  await desfusionarStand(s.id);
                                })
                              }
                              className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-warn hover:text-warn"
                            >
                              Desfusionar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <StandsDevoluciones devoluciones={devoluciones} />
      )}

      {seleccionado && (
        <StandDetalle
          stand={seleccionado}
          pagos={pagosPorStand.get(seleccionado.id) ?? []}
          asesores={asesores}
          puedeEditar={puedeEditar}
          puedeEditarComercial={puedeEditarComercial}
          onCerrar={() => setSeleccionado(null)}
        />
      )}

      {nuevoAbierto && (
        <NuevoStandModal onCerrar={() => setNuevoAbierto(false)} />
      )}

      {fusionAbierta && (
        <FusionarModal
          stands={[...paraFusionar]
            .map((id) => standsPorId.get(id))
            .filter((s): s is StandView => Boolean(s))}
          onCancelar={() => setFusionAbierta(false)}
          onConfirmar={confirmarFusion}
          pending={pending}
        />
      )}
    </div>
  );
}

function FiltrosStands({
  busqueda,
  setBusqueda,
  filtroPabellon,
  setFiltroPabellon,
  filtroEstado,
  setFiltroEstado,
  filtroEstadoVenta,
  setFiltroEstadoVenta,
  filtroCategoria,
  setFiltroCategoria,
  filtroAsesor,
  setFiltroAsesor,
  fechaDesde,
  setFechaDesde,
  fechaHasta,
  setFechaHasta,
  asesores,
  hayFiltrosActivos,
  onLimpiar,
  total,
  visibles,
}: {
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtroPabellon: Pabellon | "todos";
  setFiltroPabellon: (v: Pabellon | "todos") => void;
  filtroEstado: StandView["estado"] | "todos";
  setFiltroEstado: (v: StandView["estado"] | "todos") => void;
  filtroEstadoVenta: EstadoVenta | "todos";
  setFiltroEstadoVenta: (v: EstadoVenta | "todos") => void;
  filtroCategoria: CategoriaCliente | "todos";
  setFiltroCategoria: (v: CategoriaCliente | "todos") => void;
  filtroAsesor: string;
  setFiltroAsesor: (v: string) => void;
  fechaDesde: string;
  setFechaDesde: (v: string) => void;
  fechaHasta: string;
  setFechaHasta: (v: string) => void;
  asesores: AsesorOption[];
  hayFiltrosActivos: boolean;
  onLimpiar: () => void;
  total: number;
  visibles: number;
}) {
  const selectClass =
    "rounded-md border border-border bg-surface-2 px-2 py-1.5 text-xs outline-none focus:border-brand";

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por código, cliente, ciudad…"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={filtroPabellon}
          onChange={(e) =>
            setFiltroPabellon(e.target.value as Pabellon | "todos")
          }
          className={selectClass}
        >
          <option value="todos">Todos los pabellones</option>
          {PABELLONES.map((p) => (
            <option key={p} value={p}>
              {PABELLON_LABEL[p]}
            </option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) =>
            setFiltroEstado(e.target.value as StandView["estado"] | "todos")
          }
          className={selectClass}
        >
          <option value="todos">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {ESTADO_LABEL[e]}
            </option>
          ))}
        </select>
        <select
          value={filtroEstadoVenta}
          onChange={(e) =>
            setFiltroEstadoVenta(e.target.value as EstadoVenta | "todos")
          }
          className={selectClass}
        >
          <option value="todos">Todos los estados de venta</option>
          {ESTADOS_VENTA.map((e) => (
            <option key={e} value={e}>
              {ESTADO_VENTA_LABEL[e]}
            </option>
          ))}
        </select>
        <select
          value={filtroCategoria}
          onChange={(e) =>
            setFiltroCategoria(e.target.value as CategoriaCliente | "todos")
          }
          className={selectClass}
        >
          <option value="todos">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA_LABEL[c]}
            </option>
          ))}
        </select>
        <select
          value={filtroAsesor}
          onChange={(e) => setFiltroAsesor(e.target.value)}
          className={selectClass}
        >
          <option value="todos">Todos los asesores</option>
          {asesores.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_completo}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-xs text-muted">
          Venta desde
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className={selectClass}
          />
        </label>
        <label className="flex items-center gap-1 text-xs text-muted">
          hasta
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className={selectClass}
          />
        </label>
        {hayFiltrosActivos && (
          <button
            onClick={onLimpiar}
            className="rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Limpiar filtros
          </button>
        )}
      </div>
      <p className="text-xs text-muted">
        Mostrando {visibles} de {total} stands
      </p>
    </div>
  );
}

function TabButton({
  activo,
  onClick,
  label,
}: {
  activo: boolean;
  onClick: () => void;
  label: string;
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
      {label}
    </button>
  );
}

function StandsKpis({
  stands,
  pagos,
}: {
  stands: StandView[];
  pagos: PagoStandView[];
}) {
  const totalPotencial = stands.reduce((s, x) => s + (x.valor_con_iva ?? 0), 0);
  const totalVendido = stands.reduce((s, x) => s + (x.precio_venta ?? 0), 0);
  const pctVendido =
    totalPotencial > 0
      ? Math.min(100, Math.round((totalVendido / totalPotencial) * 100))
      : 0;

  const totalAbonos = pagos.reduce((s, p) => s + Number(p.monto), 0);
  const totalPendiente = stands.reduce(
    (s, x) => s + Number(x.valor_restante ?? 0),
    0,
  );
  const totalComprometido = totalAbonos + totalPendiente;
  const pctCobrado =
    totalComprometido > 0
      ? Math.min(100, Math.round((totalAbonos / totalComprometido) * 100))
      : 0;

  const porPabellon = PABELLONES.map((p) => {
    const enZona = stands.filter((s) => s.pabellon === p);
    const vendidos = enZona.filter(
      (s) => s.estado_venta && s.estado_venta !== "disponible",
    ).length;
    return { pabellon: p, total: enZona.length, vendidos };
  }).filter((x) => x.total > 0);

  const porFrecuencia = FRECUENCIAS.map((f) => ({
    frecuencia: f,
    n: stands.filter((s) => s.primera_vez_en_feria === f).length,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">
            Valor vendido vs. potencial total
          </h2>
          <span className="text-sm font-semibold text-brand">
            {pctVendido}%
          </span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${pctVendido}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-ok">{fmtCOP(totalVendido)} vendido</span>
          <span className="text-muted">potencial {fmtCOP(totalPotencial)}</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">
            Abonos recibidos vs. saldo pendiente
          </h2>
          <span className="text-sm font-semibold text-brand">
            {pctCobrado}%
          </span>
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${pctCobrado}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-ok">{fmtCOP(totalAbonos)} recibido</span>
          <span className="text-warn">{fmtCOP(totalPendiente)} pendiente</span>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Ocupación por pabellón
        </h2>
        {porPabellon.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted">Sin datos.</p>
        ) : (
          <div className="space-y-3">
            {porPabellon.map((x) => {
              const pct =
                x.total > 0 ? Math.round((x.vendidos / x.total) * 100) : 0;
              return (
                <div key={x.pabellon}>
                  <div className="flex justify-between text-xs">
                    <span>{PABELLON_LABEL[x.pabellon]}</span>
                    <span className="text-muted">
                      {x.vendidos}/{x.total} · {pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Frecuencia de participación
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {porFrecuencia.map((x) => (
            <div
              key={x.frecuencia}
              className="rounded-lg border border-border bg-surface-2 p-3 text-center"
            >
              <p className="text-xl font-bold text-brand">{x.n}</p>
              <p className="mt-1 text-xs text-muted">
                {FRECUENCIA_LABEL[x.frecuencia]}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function NuevoStandModal({ onCerrar }: { onCerrar: () => void }) {
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [pabellon, setPabellon] = useState<Pabellon | "">("");
  const [tipoStand, setTipoStand] = useState<TipoStand | "">("");
  const [ancho, setAncho] = useState("");
  const [fondo, setFondo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tamano = formatearTamano(ancho, fondo) ?? "";
  const precio = usePrecioStand(tamano);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) {
      setError("El código es obligatorio.");
      return;
    }
    if (precio.valorSinIva == null) {
      setError(
        "No se pudo calcular el precio: ingresá un valor manual o cargá ancho y fondo.",
      );
      return;
    }
    setError(null);
    const input: NuevoStandInput = {
      codigo: codigo.trim(),
      nombre: nombre.trim() || null,
      pabellon: pabellon || null,
      tipo_stand: tipoStand || null,
      tamano: tamano || null,
      tarifa_zona_comidas: precio.esZonaComidas,
      precio: precio.valorConIva ?? 0,
      valor_sin_iva: precio.valorSinIva,
      valor_con_iva: precio.valorConIva,
    };
    startTransition(async () => {
      const r = await crearStand(input);
      if (r.ok) onCerrar();
      else setError(r.mensaje ?? "No se pudo crear el stand.");
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
        className="my-8 w-full max-w-lg space-y-3 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nuevo stand</h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <Campo label="Código *">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Ej. AM90"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
        <Campo label="Nombre / ubicación">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Pabellón">
            <select
              value={pabellon}
              onChange={(e) => setPabellon(e.target.value as Pabellon | "")}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— Sin definir —</option>
              {PABELLONES.map((p) => (
                <option key={p} value={p}>
                  {PABELLON_LABEL[p]}
                </option>
              ))}
            </select>
          </Campo>
          <Campo label="Tipo de stand">
            <select
              value={tipoStand}
              onChange={(e) => setTipoStand(e.target.value as TipoStand | "")}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— Sin definir —</option>
              {TIPOS_STAND.map((t) => (
                <option key={t} value={t}>
                  {TIPO_STAND_LABEL[t]}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Ancho (m)">
            <input
              value={ancho}
              onChange={(e) => setAncho(e.target.value)}
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej. 4"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Fondo (m)">
            <input
              value={fondo}
              onChange={(e) => setFondo(e.target.value)}
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej. 2"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
        </div>

        <PrecioStandEditor precio={precio} />

        {error && <p className="text-xs text-danger">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear stand"}
        </button>
      </form>
    </div>
  );
}

function FusionarModal({
  stands,
  onCancelar,
  onConfirmar,
  pending,
}: {
  stands: StandView[];
  onCancelar: () => void;
  onConfirmar: (principalId: string) => void;
  pending: boolean;
}) {
  const [principalId, setPrincipalId] = useState(stands[0]?.id ?? "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCancelar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">Fusionar stands</h2>
        <p className="text-sm text-muted">
          Elegí cuál de los stands seleccionados queda como{" "}
          <strong>principal</strong>: va a concentrar los datos comerciales
          (cliente, precio, pagos). Los demás quedan referenciados a él y dejan
          de venderse por separado.
        </p>
        <div className="space-y-2">
          {stands.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                principalId === s.id
                  ? "border-brand bg-brand-soft/20"
                  : "border-border"
              }`}
            >
              <input
                type="radio"
                name="principal"
                checked={principalId === s.id}
                onChange={() => setPrincipalId(s.id)}
                className="accent-brand"
              />
              <span className="font-medium">{s.codigo}</span>
              <span className="text-muted">{s.nombre ?? "sin nombre"}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            disabled={pending || !principalId}
            onClick={() => onConfirmar(principalId)}
            className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
          >
            {pending ? "Fusionando…" : "Confirmar fusión"}
          </button>
        </div>
      </div>
    </div>
  );
}
