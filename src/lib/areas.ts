// Catálogo único de las 11 áreas de trabajo de Feria Effix 2026.
// Fuente de verdad compartida por sidebar, formularios y tableros.
// El `slug` coincide con el enum `nombre` de la tabla `areas` en Supabase.

export type AreaSlug =
  | "ponentes"
  | "stands"
  | "patrocinios"
  | "logistica"
  | "diseno"
  | "video"
  | "produccion"
  | "finanzas"
  | "estrategia"
  | "marketing"
  | "alianzas"
  | "comunidades";

export interface AreaMeta {
  slug: AreaSlug;
  label: string;
  /** Superficie pública asociada, si existe. */
  publica?: string;
  /**
   * Si el módulo ya está listo para el resto del equipo (no solo para el
   * usuario root). Un módulo con `listo: false` solo lo ve/usa el root
   * (jacsolucionesgraficas@gmail.com, ver EMAIL_ROOT en `@/lib/auth`),
   * sin importar el rol o los permisos de área que tenga cualquier otro
   * usuario. Se va pasando a `true` a medida que cada módulo queda
   * terminado y probado.
   */
  listo: boolean;
}

export const AREAS: AreaMeta[] = [
  {
    slug: "ponentes",
    label: "Ponentes",
    publica: "/postular-ponente",
    listo: false,
  },
  { slug: "stands", label: "Stands", publica: "/mapa-stands", listo: true },
  { slug: "patrocinios", label: "Patrocinios", listo: false },
  { slug: "logistica", label: "Logística", listo: false },
  { slug: "diseno", label: "Diseño", listo: false },
  { slug: "video", label: "Video", listo: false },
  { slug: "produccion", label: "Producción", listo: false },
  { slug: "finanzas", label: "Finanzas", listo: false },
  { slug: "estrategia", label: "Estrategia", listo: false },
  { slug: "marketing", label: "Marketing", listo: false },
  { slug: "alianzas", label: "Alianzas estratégicas", listo: false },
  { slug: "comunidades", label: "Comunidades", listo: false },
];

export const AREA_LABEL: Record<AreaSlug, string> = Object.fromEntries(
  AREAS.map((a) => [a.slug, a.label]),
) as Record<AreaSlug, string>;

export function getArea(slug: string): AreaMeta | undefined {
  return AREAS.find((a) => a.slug === slug);
}
