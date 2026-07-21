// Utilidades puras del presupuesto maestro de Finanzas (/panel/finanzas/presupuesto).
// Sin acceso a Supabase ni a la sesión: solo cálculos reutilizables entre el
// server component (page.tsx, que arma los datos) y el componente cliente
// (PresupuestoView, que los renderiza y recalcula totales al filtrar por
// edición). Mantenerlas acá evita duplicar la fórmula en dos lugares.

/**
 * % de variación entre el valor estimado actual y el valor real del año
 * anterior. Devuelve null (se muestra como "—" en la UI) cuando no hay dato
 * de comparación (anterior es null/undefined) o cuando dividiría por cero.
 */
export function calcularVariacionPct(
  actual: number,
  anterior: number | null | undefined,
): number | null {
  if (anterior === null || anterior === undefined || anterior === 0) {
    return null;
  }
  return (actual - anterior) / anterior;
}

/**
 * Suma valores permitiendo nulls/undefined (ignorándolos). Si NINGÚN valor
 * está definido, devuelve null en vez de 0 — para poder seguir mostrando "—"
 * en vez de un engañoso "$0" cuando simplemente no hay dato histórico.
 */
export function sumaOpcional(
  valores: Array<number | null | undefined>,
): number | null {
  const definidos = valores.filter(
    (v): v is number => v !== null && v !== undefined,
  );
  if (definidos.length === 0) return null;
  return definidos.reduce((acc, v) => acc + v, 0);
}

export type NivelSensibilidad = "resumen" | "detalle" | "personal";

const PATRONES_NIVEL_PERSONAL = [
  /n[oó]mina/i,
  /salari/i,
  /sueldo/i,
  /honorario/i,
  /\bnit\b/i,
];

/**
 * Heurística simple (no crítica) para sugerir un `nivel_sensibilidad` por
 * defecto al crear una línea de presupuesto, a partir del texto del
 * concepto. El usuario siempre puede cambiar la sugerencia a mano antes de
 * guardar — esto solo evita que alguien deje por descuido en 'resumen' un
 * concepto que claramente es de nómina/personal.
 */
export function sugerirNivelSensibilidad(concepto: string): NivelSensibilidad {
  if (PATRONES_NIVEL_PERSONAL.some((re) => re.test(concepto))) {
    return "personal";
  }
  return "resumen";
}

export type NivelMargen = "danger" | "warn" | "ok";

/**
 * Semáforo del margen general: rojo si margen/ingresos < 1%, amarillo entre
 * 1% y 3%, verde si supera 3%. Si no hay ingresos totales (división por
 * cero), se trata como el escenario de mayor riesgo (rojo).
 */
export function nivelMargen(
  margen: number,
  ingresosTotales: number,
): NivelMargen {
  if (ingresosTotales <= 0) return "danger";
  const pct = margen / ingresosTotales;
  if (pct > 0.03) return "ok";
  if (pct >= 0.01) return "warn";
  return "danger";
}
