import { notFound } from "next/navigation";
import { getSesion } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  VenueComparador,
  type EscenarioVenueView,
} from "@/components/panel/VenueComparador";

export const dynamic = "force-dynamic";

// Fila cruda tal como la devuelve Supabase con el embed de
// escenario_venue_espacios -> espacios_venue. No hay tipos generados para
// este esquema todavía, así que se castea manualmente (mismo patrón que el
// resto del panel, ver PatrociniosAdmin/CampanasEmailView).
interface EspacioEmbed {
  nombre_espacio: string;
  tarifa_unidad: number | null;
  unidad_tarifa: "CD" | "EA" | "otro";
}
interface LineaEmbed {
  id: string;
  unidades: number;
  subtotal: number;
  espacio: EspacioEmbed | null;
}
interface EscenarioEmbed {
  id: string;
  nombre_escenario: string;
  edicion: string;
  total_bruto: number | null;
  iva: number | null;
  total_neto: number | null;
  incremento_ipc_estimado: number | null;
  lineas: LineaEmbed[] | null;
}

export default async function PanelFinanzasVenuePage() {
  const sesion = await getSesion();
  if (!sesion) notFound();

  const acceso = sesion.areas.find((a) => a.slug === "finanzas");
  if (!sesion.esRoot && !acceso) notFound();

  // es_admin_global() en RLS exige rol_base directivo/administrativo, que es
  // exactamente lo que representa sesion.esAdmin (ver src/lib/auth.ts). Es el
  // único perfil que puede insertar escenarios/espacios nuevos.
  const puedeCrear = sesion.esAdmin;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("escenarios_venue")
    .select(
      `id, nombre_escenario, edicion, total_bruto, iva, total_neto, incremento_ipc_estimado,
       lineas:escenario_venue_espacios (
         id, unidades, subtotal,
         espacio:espacios_venue ( nombre_espacio, tarifa_unidad, unidad_tarifa )
       )`,
    )
    .order("edicion", { ascending: false })
    .order("nombre_escenario", { ascending: true })
    .order("creado_en", {
      ascending: true,
      referencedTable: "escenario_venue_espacios",
    });

  if (error) {
    // RLS ya filtra por es_admin_global()/es_finanzas_operativo(); si llega
    // acá con error real (no falta de acceso), no lo escondemos.
    throw new Error(
      `No se pudieron cargar los escenarios de venue: ${error.message}`,
    );
  }

  const filas = (data ?? []) as unknown as EscenarioEmbed[];

  const escenarios: EscenarioVenueView[] = filas.map((e) => ({
    id: e.id,
    nombre_escenario: e.nombre_escenario,
    edicion: e.edicion,
    total_bruto: e.total_bruto,
    iva: e.iva,
    total_neto: e.total_neto,
    incremento_ipc_estimado: e.incremento_ipc_estimado,
    lineas: (e.lineas ?? []).map((l) => ({
      id: l.id,
      unidades: Number(l.unidades),
      subtotal: Number(l.subtotal),
      nombre_espacio: l.espacio?.nombre_espacio ?? "—",
      tarifa_unidad: l.espacio?.tarifa_unidad ?? null,
      unidad_tarifa: l.espacio?.unidad_tarifa ?? "otro",
    })),
  }));

  return <VenueComparador escenarios={escenarios} puedeCrear={puedeCrear} />;
}
