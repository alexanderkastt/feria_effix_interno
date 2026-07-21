"use client";

import { useMemo, useState, useTransition } from "react";
import {
  calcularVariacionPct,
  nivelMargen,
  sugerirNivelSensibilidad,
  type NivelSensibilidad,
} from "@/lib/finanzas/presupuesto";
import { FinanzasSubnav } from "@/components/panel/FinanzasSubnav";
import {
  crearCategoria,
  actualizarCategoria,
  borrarCategoria,
  crearLinea,
  actualizarLinea,
  borrarLinea,
  type CategoriaInput,
  type LineaInput,
} from "@/app/panel/finanzas/presupuesto/actions";

type TipoCategoria = "ingreso" | "egreso";

export interface LineaPresupuestoView {
  id: string;
  categoriaId: string;
  concepto: string;
  valorEstimado: number;
  valorAnterior: number | null;
  variacionPct: number | null;
  cantidad: number | null;
  edicion: string;
  observaciones: string | null;
  nivelSensibilidad: NivelSensibilidad;
  /** true = renglón sintético "Nómina Equipo" (suma de líneas nivel 'personal'). */
  esAgregada: boolean;
}

export interface CategoriaPresupuestoView {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  parentId: string | null;
  areaId: string | null;
  lineas: LineaPresupuestoView[];
  subcategorias: CategoriaPresupuestoView[];
}

export interface AreaOption {
  id: string;
  nombre: string;
}

interface CategoriaConTotales extends CategoriaPresupuestoView {
  subcategorias: CategoriaConTotales[];
  totalEstimado: number;
  totalAnterior: number | null;
  totalVariacionPct: number | null;
}

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (pct: number | null) => {
  if (pct === null) return "—";
  return new Intl.NumberFormat("es-CO", {
    style: "percent",
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(pct);
};

const MARGEN_ESTILO: Record<ReturnType<typeof nivelMargen>, string> = {
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
};

const NIVEL_SENSIBILIDAD_OPCIONES: {
  valor: NivelSensibilidad;
  label: string;
  descripcion: string;
}[] = [
  {
    valor: "resumen",
    label: "Resumen",
    descripcion: "Totales agregados, bajo riesgo.",
  },
  {
    valor: "detalle",
    label: "Detalle",
    descripcion: "Línea individual con proveedor/monto, riesgo medio.",
  },
  {
    valor: "personal",
    label: "Personal",
    descripcion:
      "NIT/nómina individual, alto riesgo — se agrega a todos menos directivo/administrativo.",
  },
];

// Filtra el árbol de categorías a una sola edición y calcula, de abajo hacia
// arriba, los totales de cada categoría/subcategoría (recursivo). Descarta
// las categorías que quedan sin ninguna línea visible (por RLS o por no
// tener datos en la edición seleccionada) para no mostrar secciones vacías.
function filtrarPorEdicion(
  categorias: CategoriaPresupuestoView[],
  edicion: string,
): CategoriaConTotales[] {
  const resultado: CategoriaConTotales[] = [];

  for (const c of categorias) {
    const subcategorias = filtrarPorEdicion(c.subcategorias, edicion);
    const lineas = c.lineas.filter((l) => l.edicion === edicion);

    if (lineas.length === 0 && subcategorias.length === 0) continue;

    const totalEstimado =
      lineas.reduce((s, l) => s + l.valorEstimado, 0) +
      subcategorias.reduce((s, sc) => s + sc.totalEstimado, 0);

    const anterioresDefinidos = [
      ...lineas.map((l) => l.valorAnterior),
      ...subcategorias.map((sc) => sc.totalAnterior),
    ].filter((v): v is number => v !== null);
    const totalAnterior =
      anterioresDefinidos.length > 0
        ? anterioresDefinidos.reduce((s, v) => s + v, 0)
        : null;

    resultado.push({
      ...c,
      lineas,
      subcategorias,
      totalEstimado,
      totalAnterior,
      totalVariacionPct: calcularVariacionPct(totalEstimado, totalAnterior),
    });
  }

  return resultado;
}

// Suma recursiva de totalEstimado de categorías de un tipo dado (ingreso/egreso).
function sumarPorTipo(
  categorias: CategoriaConTotales[],
  tipo: "ingreso" | "egreso",
): number {
  return categorias
    .filter((c) => c.tipo === tipo)
    .reduce((s, c) => s + c.totalEstimado, 0);
}

/* ============================================================================
 * Estado de los modales de creación/edición — un único estado en el
 * componente raíz para no tener media docena de useState sueltos.
 * ========================================================================= */

type ModalCategoria =
  | { modo: "crear"; tipoPrefijo?: TipoCategoria; parentIdPrefijo?: string }
  | { modo: "editar"; categoria: CategoriaPresupuestoView };

type ModalLinea =
  | { modo: "crear"; categoriaIdPrefijo?: string }
  | { modo: "editar"; linea: LineaPresupuestoView };

type ModalBorrado =
  | { tipo: "categoria"; id: string; nombre: string }
  | { tipo: "linea"; id: string; nombre: string };

export function PresupuestoView({
  categorias,
  ediciones,
  esAdmin,
  areas,
}: {
  categorias: CategoriaPresupuestoView[];
  ediciones: string[];
  esAdmin: boolean;
  areas: AreaOption[];
}) {
  const [edicion, setEdicion] = useState(ediciones[0] ?? "");
  const [modalCategoria, setModalCategoria] = useState<ModalCategoria | null>(
    null,
  );
  const [modalLinea, setModalLinea] = useState<ModalLinea | null>(null);
  const [modalBorrado, setModalBorrado] = useState<ModalBorrado | null>(null);

  const categoriasFiltradas = useMemo(
    () => (edicion ? filtrarPorEdicion(categorias, edicion) : []),
    [categorias, edicion],
  );

  const categoriasOrdenadas = useMemo(
    () =>
      [...categoriasFiltradas].sort((a, b) => {
        if (a.tipo !== b.tipo) return a.tipo === "ingreso" ? -1 : 1;
        return a.nombre.localeCompare(b.nombre);
      }),
    [categoriasFiltradas],
  );

  // Categorías raíz (para el selector de padre del formulario de categoría) —
  // `categorias` ya es el árbol completo sin filtrar por edición, así que
  // incluye todas las categorías existentes, tengan líneas o no.
  const categoriasRaiz = useMemo(
    () => categorias.map((c) => ({ id: c.id, nombre: c.nombre, tipo: c.tipo })),
    [categorias],
  );

  // Lista plana (raíz + subcategorías, jerarquía de un solo nivel) para el
  // selector de categoría del formulario de línea.
  const categoriasPlanas = useMemo(() => {
    const out: { id: string; etiqueta: string; tipo: TipoCategoria }[] = [];
    for (const c of categorias) {
      out.push({ id: c.id, etiqueta: c.nombre, tipo: c.tipo });
      for (const sub of c.subcategorias) {
        out.push({
          id: sub.id,
          etiqueta: `${c.nombre} › ${sub.nombre}`,
          tipo: sub.tipo,
        });
      }
    }
    return out.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta));
  }, [categorias]);

  const totalIngresos = sumarPorTipo(categoriasFiltradas, "ingreso");
  const totalEgresos = sumarPorTipo(categoriasFiltradas, "egreso");
  const margen = totalIngresos - totalEgresos;
  const semaforo = nivelMargen(margen, totalIngresos);

  return (
    <div className="space-y-6">
      <FinanzasSubnav />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Presupuesto maestro
          </h1>
          <p className="text-sm text-muted">
            Plan anual por categoría, comparado contra el año anterior.
            {!esAdmin &&
              " Las líneas de nómina individual se muestran agregadas."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {esAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalCategoria({ modo: "crear" })}
                className="rounded-md border border-border px-3 py-2 text-sm text-brand hover:border-brand"
              >
                + Categoría
              </button>
              <button
                onClick={() => setModalLinea({ modo: "crear" })}
                className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
              >
                + Línea de presupuesto
              </button>
            </div>
          )}
          {ediciones.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-muted">
              Edición
              <select
                value={edicion}
                onChange={(e) => setEdicion(e.target.value)}
                className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none focus:border-brand"
              >
                {ediciones.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <ResumenGeneral
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        margen={margen}
        semaforo={semaforo}
      />

      {categoriasOrdenadas.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No hay líneas de presupuesto visibles para la edición seleccionada.
        </div>
      )}

      {categoriasOrdenadas.map((c) => (
        <CategoriaSeccion
          key={c.id}
          categoria={c}
          esAdmin={esAdmin}
          onEditarCategoria={(cat) =>
            setModalCategoria({ modo: "editar", categoria: cat })
          }
          onBorrarCategoria={(cat) =>
            setModalBorrado({
              tipo: "categoria",
              id: cat.id,
              nombre: cat.nombre,
            })
          }
          onNuevaSubcategoria={(padre) =>
            setModalCategoria({
              modo: "crear",
              tipoPrefijo: padre.tipo,
              parentIdPrefijo: padre.id,
            })
          }
          onNuevaLinea={(categoriaId) =>
            setModalLinea({ modo: "crear", categoriaIdPrefijo: categoriaId })
          }
          onEditarLinea={(linea) => setModalLinea({ modo: "editar", linea })}
          onBorrarLinea={(linea) =>
            setModalBorrado({
              tipo: "linea",
              id: linea.id,
              nombre: linea.concepto,
            })
          }
        />
      ))}

      {categoriasOrdenadas.length > 0 && (
        <ResumenGeneral
          totalIngresos={totalIngresos}
          totalEgresos={totalEgresos}
          margen={margen}
          semaforo={semaforo}
          titulo="Total general"
        />
      )}

      {esAdmin && modalCategoria && (
        <CategoriaModal
          modal={modalCategoria}
          categoriasRaiz={categoriasRaiz}
          areas={areas}
          onCerrar={() => setModalCategoria(null)}
        />
      )}

      {esAdmin && modalLinea && (
        <LineaModal
          modal={modalLinea}
          categoriasPlanas={categoriasPlanas}
          edicionSugerida={edicion}
          onCerrar={() => setModalLinea(null)}
        />
      )}

      {esAdmin && modalBorrado && (
        <ConfirmarBorradoModal
          objetivo={modalBorrado}
          onCerrar={() => setModalBorrado(null)}
        />
      )}
    </div>
  );
}

function ResumenGeneral({
  totalIngresos,
  totalEgresos,
  margen,
  semaforo,
  titulo,
}: {
  totalIngresos: number;
  totalEgresos: number;
  margen: number;
  semaforo: ReturnType<typeof nivelMargen>;
  titulo?: string;
}) {
  return (
    <div className="space-y-2">
      {titulo && (
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {titulo}
        </h2>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total ingresos</p>
          <p className="mt-1 text-2xl font-bold text-brand">
            {fmtCOP(totalIngresos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Total egresos</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {fmtCOP(totalEgresos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-muted">Margen</p>
          <p className={`mt-1 text-2xl font-bold ${MARGEN_ESTILO[semaforo]}`}>
            {fmtCOP(margen)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CategoriaSeccion({
  categoria,
  esAdmin,
  onEditarCategoria,
  onBorrarCategoria,
  onNuevaSubcategoria,
  onNuevaLinea,
  onEditarLinea,
  onBorrarLinea,
}: {
  categoria: CategoriaConTotales;
  esAdmin: boolean;
  onEditarCategoria: (categoria: CategoriaPresupuestoView) => void;
  onBorrarCategoria: (categoria: CategoriaPresupuestoView) => void;
  onNuevaSubcategoria: (categoria: CategoriaPresupuestoView) => void;
  onNuevaLinea: (categoriaId: string) => void;
  onEditarLinea: (linea: LineaPresupuestoView) => void;
  onBorrarLinea: (linea: LineaPresupuestoView) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{categoria.nombre}</h3>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs capitalize ${
              categoria.tipo === "ingreso"
                ? "border-brand/40 bg-brand-soft/30 text-brand"
                : "border-border bg-surface text-muted"
            }`}
          >
            {categoria.tipo}
          </span>
          {esAdmin && (
            <div className="flex items-center gap-1">
              <BotonIcono
                texto="+ subcategoría"
                onClick={() => onNuevaSubcategoria(categoria)}
              />
              <BotonIcono
                texto="Editar"
                onClick={() => onEditarCategoria(categoria)}
              />
              <BotonIcono
                texto="Borrar"
                variante="danger"
                onClick={() => onBorrarCategoria(categoria)}
              />
            </div>
          )}
        </div>
        <span className="text-sm font-semibold">
          {fmtCOP(categoria.totalEstimado)}
        </span>
      </header>

      <div className="space-y-4 p-4">
        {categoria.subcategorias.map((sub) => (
          <div
            key={sub.id}
            className="overflow-hidden rounded-lg border border-border/70"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 bg-surface-2/60 px-3 py-2 text-sm font-medium text-muted">
              <span className="flex items-center gap-2">
                {sub.nombre}
                {esAdmin && (
                  <div className="flex items-center gap-1">
                    <BotonIcono
                      texto="Editar"
                      onClick={() => onEditarCategoria(sub)}
                    />
                    <BotonIcono
                      texto="Borrar"
                      variante="danger"
                      onClick={() => onBorrarCategoria(sub)}
                    />
                  </div>
                )}
              </span>
              {esAdmin && (
                <BotonIcono
                  texto="+ línea"
                  onClick={() => onNuevaLinea(sub.id)}
                />
              )}
            </div>
            <TablaLineas
              lineas={sub.lineas}
              totalEstimado={sub.totalEstimado}
              totalAnterior={sub.totalAnterior}
              totalVariacionPct={sub.totalVariacionPct}
              esAdmin={esAdmin}
              onEditarLinea={onEditarLinea}
              onBorrarLinea={onBorrarLinea}
            />
          </div>
        ))}

        {(categoria.lineas.length > 0 || esAdmin) && (
          <div>
            {esAdmin && (
              <div className="mb-2 flex justify-end">
                <BotonIcono
                  texto="+ línea en esta categoría"
                  onClick={() => onNuevaLinea(categoria.id)}
                />
              </div>
            )}
            {categoria.lineas.length > 0 && (
              <TablaLineas
                lineas={categoria.lineas}
                totalEstimado={categoria.lineas.reduce(
                  (s, l) => s + l.valorEstimado,
                  0,
                )}
                totalAnterior={(() => {
                  const definidos = categoria.lineas
                    .map((l) => l.valorAnterior)
                    .filter((v): v is number => v !== null);
                  return definidos.length > 0
                    ? definidos.reduce((s, v) => s + v, 0)
                    : null;
                })()}
                totalVariacionPct={null}
                esAdmin={esAdmin}
                onEditarLinea={onEditarLinea}
                onBorrarLinea={onBorrarLinea}
              />
            )}
          </div>
        )}
        {categoria.subcategorias.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-brand/30 bg-brand-soft/10 px-3 py-2 text-sm">
            <span className="font-medium text-muted">
              Total {categoria.nombre} (con subcategorías)
            </span>
            <span className="font-semibold text-brand">
              {fmtCOP(categoria.totalEstimado)}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

function BotonIcono({
  texto,
  onClick,
  variante,
}: {
  texto: string;
  onClick: () => void;
  variante?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-xs ${
        variante === "danger"
          ? "border-border text-danger hover:border-danger"
          : "border-border text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {texto}
    </button>
  );
}

function TablaLineas({
  lineas,
  totalEstimado,
  totalAnterior,
  totalVariacionPct,
  esAdmin,
  onEditarLinea,
  onBorrarLinea,
}: {
  lineas: LineaPresupuestoView[];
  totalEstimado: number;
  totalAnterior: number | null;
  totalVariacionPct: number | null;
  esAdmin: boolean;
  onEditarLinea: (linea: LineaPresupuestoView) => void;
  onBorrarLinea: (linea: LineaPresupuestoView) => void;
}) {
  const totalVar =
    totalVariacionPct ?? calcularVariacionPct(totalEstimado, totalAnterior);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="p-3 font-medium">Concepto</th>
            <th className="p-3 font-medium">Edición</th>
            <th className="p-3 font-medium text-right">Estimado actual</th>
            <th className="p-3 font-medium text-right">Real año anterior</th>
            <th className="p-3 font-medium text-right">% Variación</th>
            {esAdmin && (
              <th className="p-3 font-medium text-right">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {lineas.map((l) => (
            <tr key={l.id} className="border-b border-border/60">
              <td className="p-3">
                {l.concepto}
                {l.esAgregada && (
                  <span className="ml-2 rounded-full border border-brand/40 bg-brand-soft/20 px-2 py-0.5 text-xs text-brand">
                    agregado
                  </span>
                )}
              </td>
              <td className="p-3 text-muted">{l.edicion}</td>
              <td className="p-3 text-right">{fmtCOP(l.valorEstimado)}</td>
              <td className="p-3 text-right text-muted">
                {l.valorAnterior === null ? "—" : fmtCOP(l.valorAnterior)}
              </td>
              <td className="p-3 text-right text-muted">
                {fmtPct(l.variacionPct)}
              </td>
              {esAdmin && (
                <td className="p-3 text-right">
                  {/* Defensa adicional: una fila agregada ("Nómina Equipo")
                      NUNCA muestra botón de editar/borrar, aunque esta rama
                      solo se ejecuta para esAdmin (las agregadas solo existen
                      para no-admin, así que en la práctica esto no debería
                      pasar — pero el chequeo queda igual). */}
                  {!l.esAgregada && (
                    <div className="flex justify-end gap-1">
                      <BotonIcono
                        texto="Editar"
                        onClick={() => onEditarLinea(l)}
                      />
                      <BotonIcono
                        texto="Borrar"
                        variante="danger"
                        onClick={() => onBorrarLinea(l)}
                      />
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
          {lineas.length === 0 && (
            <tr>
              <td
                colSpan={esAdmin ? 6 : 5}
                className="p-3 text-center text-muted"
              >
                Sin líneas en esta categoría para la edición seleccionada.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-border font-semibold">
            <td className="p-3" colSpan={2}>
              Total
            </td>
            <td className="p-3 text-right">{fmtCOP(totalEstimado)}</td>
            <td className="p-3 text-right">
              {totalAnterior === null ? "—" : fmtCOP(totalAnterior)}
            </td>
            <td className="p-3 text-right">{fmtPct(totalVar)}</td>
            {esAdmin && <td className="p-3" />}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/* ============================================================================
 * Formulario: crear/editar categoría
 * ========================================================================= */

function CategoriaModal({
  modal,
  categoriasRaiz,
  areas,
  onCerrar,
}: {
  modal: ModalCategoria;
  categoriasRaiz: { id: string; nombre: string; tipo: TipoCategoria }[];
  areas: AreaOption[];
  onCerrar: () => void;
}) {
  const editando = modal.modo === "editar" ? modal.categoria : null;
  const crear = modal.modo === "crear" ? modal : null;

  const [nombre, setNombre] = useState(editando?.nombre ?? "");
  const [tipo, setTipo] = useState<TipoCategoria>(
    editando?.tipo ?? crear?.tipoPrefijo ?? "egreso",
  );
  const [parentId, setParentId] = useState<string>(
    editando?.parentId ??
      (modal.modo === "crear" ? (modal.parentIdPrefijo ?? "") : ""),
  );
  const [areaId, setAreaId] = useState<string>(editando?.areaId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Restricciones de edición: el tipo no se puede tocar si la categoría ya
  // tiene líneas propias o subcategorías (ver actualizarCategoria en
  // actions.ts, que revalida esto mismo del lado del servidor).
  const tipoBloqueadoPorDatos =
    editando != null &&
    (editando.lineas.length > 0 || editando.subcategorias.length > 0);

  const opcionesPadre = categoriasRaiz.filter(
    (c) => c.tipo === tipo && c.id !== editando?.id,
  );
  const padreSeleccionado = opcionesPadre.find((c) => c.id === parentId);
  // Si hay un padre elegido, el tipo se fija al de ese padre (defensa extra,
  // aunque la lista de padres ya está filtrada por el tipo actual).
  const tipoEfectivo = padreSeleccionado ? padreSeleccionado.tipo : tipo;
  const tipoBloqueado = tipoBloqueadoPorDatos || parentId !== "";

  function cambiarTipo(nuevo: TipoCategoria) {
    setTipo(nuevo);
    // Si el padre elegido ya no es del nuevo tipo, se limpia para no mandar
    // una combinación inconsistente al servidor.
    if (
      parentId &&
      !categoriasRaiz.some((c) => c.id === parentId && c.tipo === nuevo)
    ) {
      setParentId("");
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre de la categoría es obligatorio.");
      return;
    }

    const input: CategoriaInput = {
      nombre,
      tipo: tipoEfectivo,
      parent_id: parentId || null,
      area_id: areaId || null,
    };

    startTransition(async () => {
      const r =
        editando != null
          ? await actualizarCategoria(editando.id, input)
          : await crearCategoria(input);
      if (r.ok) {
        onCerrar();
      } else {
        setError(r.mensaje ?? "No se pudo guardar la categoría.");
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
        className="my-8 w-full max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {editando ? "Editar categoría" : "Nueva categoría"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <Campo label="Nombre *">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder='Ej. "Marketing"'
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <Campo label="Tipo *">
          <select
            value={tipoEfectivo}
            disabled={tipoBloqueado}
            onChange={(e) => cambiarTipo(e.target.value as TipoCategoria)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
          >
            <option value="ingreso">Ingreso</option>
            <option value="egreso">Egreso</option>
          </select>
          {tipoBloqueadoPorDatos && (
            <span className="block pt-1 text-[11px] text-muted">
              No se puede cambiar: esta categoría ya tiene líneas o
              subcategorías asociadas.
            </span>
          )}
          {!tipoBloqueadoPorDatos && parentId && (
            <span className="block pt-1 text-[11px] text-muted">
              Determinado por la categoría padre elegida abajo.
            </span>
          )}
        </Campo>

        <Campo label="Categoría padre (opcional)">
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Ninguna (categoría raíz)</option>
            {opcionesPadre.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <span className="block pt-1 text-[11px] text-muted">
            Solo se listan categorías raíz del tipo elegido — la jerarquía es de
            un solo nivel.
          </span>
        </Campo>

        <Campo label="Área (opcional)">
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Ninguna (transversal)</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>

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
              : editando
                ? "Guardar cambios"
                : "Crear categoría"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================================
 * Formulario: crear/editar línea de presupuesto
 * ========================================================================= */

function LineaModal({
  modal,
  categoriasPlanas,
  edicionSugerida,
  onCerrar,
}: {
  modal: ModalLinea;
  categoriasPlanas: { id: string; etiqueta: string; tipo: TipoCategoria }[];
  edicionSugerida: string;
  onCerrar: () => void;
}) {
  const editando = modal.modo === "editar" ? modal.linea : null;

  const [categoriaId, setCategoriaId] = useState(
    editando?.categoriaId ??
      (modal.modo === "crear" ? (modal.categoriaIdPrefijo ?? "") : ""),
  );
  const [concepto, setConcepto] = useState(editando?.concepto ?? "");
  const [valorEstimado, setValorEstimado] = useState(
    editando ? String(editando.valorEstimado) : "",
  );
  const [valorAnterior, setValorAnterior] = useState(
    editando?.valorAnterior != null ? String(editando.valorAnterior) : "",
  );
  const [cantidad, setCantidad] = useState(
    editando?.cantidad != null ? String(editando.cantidad) : "",
  );
  const [edicion, setEdicion] = useState(
    editando?.edicion ?? edicionSugerida ?? "",
  );
  const [observaciones, setObservaciones] = useState(
    editando?.observaciones ?? "",
  );
  const [nivelSensibilidad, setNivelSensibilidad] = useState<NivelSensibilidad>(
    editando?.nivelSensibilidad ?? sugerirNivelSensibilidad(concepto),
  );
  const [nivelTocado, setNivelTocado] = useState(editando != null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function cambiarConcepto(valor: string) {
    setConcepto(valor);
    if (!nivelTocado) {
      setNivelSensibilidad(sugerirNivelSensibilidad(valor));
    }
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoriaId) {
      setError("Elegí una categoría.");
      return;
    }
    if (!concepto.trim()) {
      setError("El concepto es obligatorio.");
      return;
    }
    if (!edicion.trim()) {
      setError('La edición es obligatoria (ej. "2026").');
      return;
    }
    const valorEstimadoNum = Number(valorEstimado);
    if (valorEstimado.trim() === "" || !Number.isFinite(valorEstimadoNum)) {
      setError("El valor estimado actual debe ser un número.");
      return;
    }

    const input: LineaInput = {
      categoria_id: categoriaId,
      concepto,
      valor_estimado_actual: valorEstimadoNum,
      valor_real_anio_anterior:
        valorAnterior.trim() === "" ? null : Number(valorAnterior),
      cantidad: cantidad.trim() === "" ? null : Number(cantidad),
      edicion,
      observaciones: observaciones.trim() === "" ? null : observaciones,
      nivel_sensibilidad: nivelSensibilidad,
    };

    startTransition(async () => {
      const r =
        editando != null
          ? await actualizarLinea(editando.id, input)
          : await crearLinea(input);
      if (r.ok) {
        onCerrar();
      } else {
        setError(r.mensaje ?? "No se pudo guardar la línea de presupuesto.");
      }
    });
  }

  const descripcionNivel = NIVEL_SENSIBILIDAD_OPCIONES.find(
    (o) => o.valor === nivelSensibilidad,
  )?.descripcion;

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
            {editando
              ? "Editar línea de presupuesto"
              : "Nueva línea de presupuesto"}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
          >
            Cerrar
          </button>
        </div>

        <Campo label="Categoría *">
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Elegí una categoría…</option>
            {categoriasPlanas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.etiqueta} ({c.tipo})
              </option>
            ))}
          </select>
        </Campo>

        <Campo label="Concepto *">
          <input
            value={concepto}
            onChange={(e) => cambiarConcepto(e.target.value)}
            placeholder='Ej. "Arriendo de escenario principal"'
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Valor estimado actual *">
            <input
              type="number"
              step="0.01"
              value={valorEstimado}
              onChange={(e) => setValorEstimado(e.target.value)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Valor real año anterior (opcional)">
            <input
              type="number"
              step="0.01"
              value={valorAnterior}
              onChange={(e) => setValorAnterior(e.target.value)}
              placeholder="—"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Cantidad (opcional)">
            <input
              type="number"
              step="0.01"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ej. cantidad de escarapelas"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Edición *">
            <input
              value={edicion}
              onChange={(e) => setEdicion(e.target.value)}
              placeholder="Ej. 2026"
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
        </div>

        <Campo label="Observaciones (opcional)">
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <Campo label="Nivel de sensibilidad *">
          <select
            value={nivelSensibilidad}
            onChange={(e) => {
              setNivelTocado(true);
              setNivelSensibilidad(e.target.value as NivelSensibilidad);
            }}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            {NIVEL_SENSIBILIDAD_OPCIONES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.label}
              </option>
            ))}
          </select>
          {descripcionNivel && (
            <span className="block pt-1 text-[11px] text-muted">
              {descripcionNivel}
            </span>
          )}
        </Campo>

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
              : editando
                ? "Guardar cambios"
                : "Crear línea"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ============================================================================
 * Confirmación de borrado (categoría o línea)
 * ========================================================================= */

function ConfirmarBorradoModal({
  objetivo,
  onCerrar,
}: {
  objetivo: ModalBorrado;
  onCerrar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const r =
        objetivo.tipo === "categoria"
          ? await borrarCategoria(objetivo.id)
          : await borrarLinea(objetivo.id);
      if (r.ok) {
        onCerrar();
      } else {
        setError(r.mensaje ?? "No se pudo borrar.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">
          {objetivo.tipo === "categoria" ? "Borrar categoría" : "Borrar línea"}
        </h2>
        <p className="text-sm text-muted">
          ¿Seguro que querés borrar{" "}
          <strong className="text-foreground">{objetivo.nombre}</strong>? Esta
          acción no se puede deshacer.
        </p>

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
            type="button"
            disabled={pending}
            onClick={confirmar}
            className="rounded-md bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Borrando…" : "Borrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
