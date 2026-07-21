import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { calcularVariacionPct, sumaOpcional } from "@/lib/finanzas/presupuesto";
import { AREA_LABEL, type AreaSlug } from "@/lib/areas";
import {
  PresupuestoView,
  type CategoriaPresupuestoView,
  type LineaPresupuestoView,
} from "@/components/panel/PresupuestoView";

export const dynamic = "force-dynamic";

type TipoCategoria = "ingreso" | "egreso";
type NivelSensibilidad = "resumen" | "detalle" | "personal";

interface CategoriaRow {
  id: string;
  nombre: string;
  parent_id: string | null;
  tipo: TipoCategoria;
  area_id: string | null;
}

interface LineaRow {
  id: string;
  categoria_id: string;
  concepto: string;
  valor_estimado_actual: number;
  valor_real_anio_anterior: number | null;
  cantidad: number | null;
  edicion: string;
  observaciones: string | null;
  nivel_sensibilidad: NivelSensibilidad;
}

interface AreaRow {
  id: string;
  nombre: string;
}

export default async function PanelFinanzasPresupuestoPage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "finanzas");
  if (!sesion.esRoot && !acceso) notFound();

  const supabase = await createClient();

  // RLS ya filtra ambas tablas según el usuario autenticado — acá solo se
  // consulta, no se reconstruye la lógica de permisos con condicionales de rol.
  // La lista de áreas solo se necesita para el selector del formulario de
  // categorías (crear/editar), que solo renderiza para sesion.esAdmin — se
  // evita la consulta extra para el resto de los usuarios.
  const [{ data: categoriasData }, { data: lineasData }, { data: areasData }] =
    await Promise.all([
      supabase
        .from("categorias_presupuesto")
        .select("id, nombre, parent_id, tipo, area_id")
        .order("nombre"),
      supabase
        .from("lineas_presupuesto")
        .select(
          "id, categoria_id, concepto, valor_estimado_actual, valor_real_anio_anterior, cantidad, edicion, observaciones, nivel_sensibilidad",
        )
        .order("concepto"),
      sesion.esAdmin
        ? supabase.from("areas").select("id, nombre").order("nombre")
        : Promise.resolve({ data: [] as AreaRow[] }),
    ]);

  const categoriasRaw = (categoriasData ?? []) as CategoriaRow[];
  const lineasRaw = (lineasData ?? []) as LineaRow[];
  const areas = (areasData ?? []) as AreaRow[];

  // ---------------------------------------------------------------------
  // Agregación de nivel "personal" — ocurre ACÁ, en el servidor, antes de
  // construir las props del componente cliente. Para cualquier usuario que
  // no sea sesion.esAdmin, las líneas nivel 'personal' que RLS le haya
  // dejado ver (todas si es admin — no aplica este bloque —, o algunas
  // puntuales si es finanzas_operativo con una excepción vigente) se
  // colapsan en un único renglón sintético "Nómina Equipo" por categoría y
  // edición. Los conceptos individuales (nombres, montos por persona) NUNCA
  // se arman en un array que llegue a <PresupuestoView>, así que no viajan
  // al cliente ni al bundle/payload RSC.
  // ---------------------------------------------------------------------
  let lineasVisibles: LineaRow[];
  if (sesion.esAdmin) {
    lineasVisibles = lineasRaw;
  } else {
    const normales = lineasRaw.filter(
      (l) => l.nivel_sensibilidad !== "personal",
    );
    const personales = lineasRaw.filter(
      (l) => l.nivel_sensibilidad === "personal",
    );

    const grupos = new Map<string, LineaRow[]>();
    for (const l of personales) {
      const clave = `${l.categoria_id}::${l.edicion}`;
      const grupo = grupos.get(clave) ?? [];
      grupo.push(l);
      grupos.set(clave, grupo);
    }

    const agregadas: LineaRow[] = Array.from(grupos.entries()).map(
      ([clave, grupo]) => {
        const [categoria_id, edicion] = clave.split("::");
        return {
          id: `nomina-equipo::${clave}`,
          categoria_id,
          concepto: "Nómina Equipo",
          valor_estimado_actual:
            sumaOpcional(grupo.map((g) => g.valor_estimado_actual)) ?? 0,
          valor_real_anio_anterior: sumaOpcional(
            grupo.map((g) => g.valor_real_anio_anterior),
          ),
          cantidad: null,
          edicion,
          observaciones: null,
          nivel_sensibilidad: "personal" as const,
        };
      },
    );

    lineasVisibles = [...normales, ...agregadas];
  }

  // ---------------------------------------------------------------------
  // Transformación a las vistas que consume el componente cliente: %
  // variación calculado acá (server), manejando valor_real_anio_anterior
  // null o 0 devolviendo null (se muestra "—" en la UI, nunca un porcentaje
  // hardcodeado ni una división por cero).
  // ---------------------------------------------------------------------
  const lineasConCategoria = lineasVisibles.map((l) => {
    const valorEstimado = Number(l.valor_estimado_actual);
    const valorAnterior =
      l.valor_real_anio_anterior === null
        ? null
        : Number(l.valor_real_anio_anterior);

    const linea: LineaPresupuestoView = {
      id: l.id,
      categoriaId: l.categoria_id,
      concepto: l.concepto,
      valorEstimado,
      valorAnterior,
      variacionPct: calcularVariacionPct(valorEstimado, valorAnterior),
      cantidad: l.cantidad === null ? null : Number(l.cantidad),
      edicion: l.edicion,
      observaciones: l.observaciones,
      nivelSensibilidad: l.nivel_sensibilidad,
      esAgregada: l.id.startsWith("nomina-equipo::"),
    };
    return { categoriaId: l.categoria_id, linea };
  });

  const lineasPorCategoria = new Map<string, LineaPresupuestoView[]>();
  for (const { categoriaId, linea } of lineasConCategoria) {
    const arr = lineasPorCategoria.get(categoriaId) ?? [];
    arr.push(linea);
    lineasPorCategoria.set(categoriaId, arr);
  }

  function construirArbol(parentId: string | null): CategoriaPresupuestoView[] {
    return categoriasRaw
      .filter((c) => c.parent_id === parentId)
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipo: c.tipo,
        parentId: c.parent_id,
        areaId: c.area_id,
        lineas: lineasPorCategoria.get(c.id) ?? [],
        subcategorias: construirArbol(c.id),
      }));
  }

  const categorias = construirArbol(null);

  const ediciones = Array.from(
    new Set(lineasConCategoria.map(({ linea }) => linea.edicion)),
  ).sort((a, b) => b.localeCompare(a));

  // Etiqueta legible (AREA_LABEL) en vez del valor crudo del enum de la base
  // — mismo catálogo que usa el sidebar, para no inventar otro mapping acá.
  const areasParaFormulario = areas.map((a) => ({
    id: a.id,
    nombre: AREA_LABEL[a.nombre as AreaSlug] ?? a.nombre,
  }));

  return (
    <PresupuestoView
      categorias={categorias}
      ediciones={ediciones}
      esAdmin={sesion.esAdmin}
      areas={areasParaFormulario}
    />
  );
}
