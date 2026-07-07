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
}

export const AREAS: AreaMeta[] = [
  { slug: "ponentes", label: "Ponentes", publica: "/postular-ponente" },
  { slug: "stands", label: "Stands", publica: "/mapa-stands" },
  { slug: "patrocinios", label: "Patrocinios" },
  { slug: "logistica", label: "Logística" },
  { slug: "diseno", label: "Diseño" },
  { slug: "video", label: "Video" },
  { slug: "produccion", label: "Producción" },
  { slug: "finanzas", label: "Finanzas" },
  { slug: "estrategia", label: "Estrategia" },
  { slug: "marketing", label: "Marketing" },
  { slug: "alianzas", label: "Alianzas estratégicas" },
  { slug: "comunidades", label: "Comunidades" },
];

export const AREA_LABEL: Record<AreaSlug, string> = Object.fromEntries(
  AREAS.map((a) => [a.slug, a.label]),
) as Record<AreaSlug, string>;

export function getArea(slug: string): AreaMeta | undefined {
  return AREAS.find((a) => a.slug === slug);
}
