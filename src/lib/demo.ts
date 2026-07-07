// Datos de DEMOSTRACIÓN para validar la UI del panel sin base de datos.
// Se reemplazan por consultas a Supabase (tabla `tareas`) al conectar el proyecto.

import type { AreaSlug } from "./areas";

export type EstadoTarea = "pendiente" | "en_proceso" | "bloqueado" | "hecho";
export type Prioridad = "baja" | "media" | "alta";

export interface TareaDemo {
  id: string;
  area: AreaSlug;
  titulo: string;
  responsable: string;
  estado: EstadoTarea;
  prioridad: Prioridad;
  fecha_limite?: string;
}

export const ESTADOS: { key: EstadoTarea; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "en_proceso", label: "En proceso" },
  { key: "bloqueado", label: "Bloqueado" },
  { key: "hecho", label: "Hecho" },
];

export const TAREAS_DEMO: TareaDemo[] = [
  {
    id: "t1",
    area: "ponentes",
    titulo: "Definir shortlist de keynotes",
    responsable: "Sandra",
    estado: "en_proceso",
    prioridad: "alta",
    fecha_limite: "2026-07-20",
  },
  {
    id: "t2",
    area: "ponentes",
    titulo: "Cerrar guion de conversatorio IA",
    responsable: "Sandra",
    estado: "pendiente",
    prioridad: "media",
  },
  {
    id: "t3",
    area: "ponentes",
    titulo: "Confirmar ponente de neuromarketing",
    responsable: "Sandra",
    estado: "bloqueado",
    prioridad: "alta",
    fecha_limite: "2026-07-15",
  },
  {
    id: "t4",
    area: "ponentes",
    titulo: "Escarapelas primer bloque",
    responsable: "Diseño",
    estado: "hecho",
    prioridad: "baja",
  },
  {
    id: "t5",
    area: "stands",
    titulo: "Actualizar plano comercial Plaza Mayor",
    responsable: "Aleja",
    estado: "en_proceso",
    prioridad: "alta",
    fecha_limite: "2026-07-10",
  },
  {
    id: "t6",
    area: "stands",
    titulo: "Cotizar mobiliario stands premium",
    responsable: "Aleja",
    estado: "pendiente",
    prioridad: "media",
  },
  {
    id: "t7",
    area: "logistica",
    titulo: "Reservar transporte de equipos",
    responsable: "Frijolito",
    estado: "pendiente",
    prioridad: "media",
    fecha_limite: "2026-08-01",
  },
  {
    id: "t8",
    area: "logistica",
    titulo: "Dossier técnico audio/pantalla",
    responsable: "Frijolito",
    estado: "en_proceso",
    prioridad: "alta",
  },
  {
    id: "t9",
    area: "marketing",
    titulo: "Calendario de contenidos pre-evento",
    responsable: "Joaquín",
    estado: "en_proceso",
    prioridad: "alta",
  },
  {
    id: "t10",
    area: "marketing",
    titulo: "Brief pauta Meta Ads",
    responsable: "Joaquín",
    estado: "pendiente",
    prioridad: "media",
  },
  {
    id: "t11",
    area: "patrocinios",
    titulo: "Propuesta tier Platino a marca ancla",
    responsable: "Estefanía",
    estado: "en_proceso",
    prioridad: "alta",
    fecha_limite: "2026-07-12",
  },
  {
    id: "t12",
    area: "patrocinios",
    titulo: "Entregables pendientes patrocinador Oro",
    responsable: "Estefanía",
    estado: "bloqueado",
    prioridad: "media",
  },
];

export function tareasDeArea(area: AreaSlug): TareaDemo[] {
  return TAREAS_DEMO.filter((t) => t.area === area);
}

export function resumenPorArea() {
  const map = new Map<AreaSlug, Record<EstadoTarea, number>>();
  for (const t of TAREAS_DEMO) {
    const r = map.get(t.area) ?? {
      pendiente: 0,
      en_proceso: 0,
      bloqueado: 0,
      hecho: 0,
    };
    r[t.estado] += 1;
    map.set(t.area, r);
  }
  return map;
}
