"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getSesion } from "@/lib/auth";

// Datos comerciales (comprador, precios, pagos, fusiones) requieren nivel
// 'admin' en el área 'stands' (o admin global) — más estricto que el resto
// del panel (checklist/estado/patrocinador), que solo pide nivel != 'lectura'.
// No alcanza con ocultar el botón en el panel: cada acción sensible valida
// esto server-side, porque la política RLS `puede_editar_area` por sí sola
// permite tanto nivel 'edicion' como 'admin'.
async function puedeGestionarComercialStands(): Promise<boolean> {
  const sesion = await getSesion();
  if (!sesion) return false;
  if (sesion.esAdmin) return true;
  const acceso = sesion.areas.find((a) => a.slug === "stands");
  return acceso?.nivel === "admin";
}

const SIN_PERMISO_COMERCIAL: AccionResult = {
  ok: false,
  mensaje:
    "No tenés permiso para editar datos comerciales de stands (cliente, precios, pagos o fusiones). Necesitás nivel admin en el área de stands.",
};

type EstadoStand =
  | "disponible"
  | "bloqueado_temporal"
  | "reservado"
  | "vendido";

export interface AccionResult {
  ok: boolean;
  mensaje?: string;
}

// Cambiar estado manualmente (casos gestionados por fuera del formulario público).
// RLS: requiere puede_editar_area('stands').
export async function cambiarEstadoStand(
  id: string,
  estado: EstadoStand,
): Promise<AccionResult> {
  const supabase = await createClient();
  // Al liberar a 'disponible' limpiamos datos de cliente y bloqueo.
  const extra =
    estado === "disponible"
      ? {
          bloqueado_hasta: null,
          cliente_nombre: null,
          cliente_email: null,
          cliente_telefono: null,
        }
      : {};
  const { error } = await supabase
    .from("stands")
    .update({ estado, ...extra })
    .eq("id", id);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}

// Vincular / desvincular un stand con un patrocinador.
export async function vincularPatrocinador(
  standId: string,
  patrocinadorId: string | null,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stands")
    .update({ patrocinador_id: patrocinadorId })
    .eq("id", standId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  return { ok: true };
}

type MedioPago =
  | "cuenta_banco_effix"
  | "efectivo"
  | "mercado_pago"
  | "payoneer"
  | "trazabilidad_effi"
  | "usdt";

type TipoPagoStand = "primer_abono" | "abono_adicional" | "pago_final";

export interface NuevoPagoInput {
  monto: number;
  fecha: string;
  medio_pago: MedioPago | null;
  tipo_pago: TipoPagoStand | null;
}

// Registrar un abono de un stand. Inserta en pagos_stand; un trigger de base
// de datos recalcula stands.valor_restante automáticamente (nunca se edita
// esa columna a mano desde acá).
export async function registrarPago(
  standId: string,
  input: NuevoPagoInput,
): Promise<AccionResult> {
  if (!(await puedeGestionarComercialStands())) return SIN_PERMISO_COMERCIAL;
  if (!Number.isFinite(input.monto) || input.monto <= 0) {
    return { ok: false, mensaje: "El monto debe ser mayor a cero." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("pagos_stand").insert({
    stand_id: standId,
    monto: input.monto,
    fecha: input.fecha,
    medio_pago: input.medio_pago,
    tipo_pago: input.tipo_pago,
    registrado_por: user?.id ?? null,
  });
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  return { ok: true };
}

export type ChecklistCampoStand =
  | "contrato_entregado"
  | "manual_entregado"
  | "logo_recibido"
  | "marcado_en_mapa"
  | "publicado_web"
  | "imagen_enviada"
  | "formulario_directorio_lleno"
  | "paz_y_salvo";

// Marca/desmarca un ítem del checklist operativo de un stand.
export async function actualizarChecklistStand(
  standId: string,
  campo: ChecklistCampoStand,
  valor: boolean,
): Promise<AccionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stands")
    .update({ [campo]: valor })
    .eq("id", standId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  return { ok: true };
}

type Pabellon =
  | "azul"
  | "amarillo"
  | "blanco"
  | "rojo"
  | "zona_comidas"
  | "burbujas"
  | "gran_salon"
  | "plazoleta"
  | "hall_verde"
  | "hall";

type TipoStand = "isla" | "tipo_u" | "esquinero" | "lineal";

type CategoriaCliente =
  | "academia_educacion"
  | "comercializadora_distribuidor"
  | "fabricante"
  | "importaciones"
  | "logistica"
  | "plataforma"
  | "servicios";

type FormaPagoRestante =
  | "bimestral_directo"
  | "mensual_directo"
  | "mensual_debito_efficomerce"
  | "solo_un_pago"
  | "ya_pago_totalidad";

type FrecuenciaParticipacion = "primera_vez" | "segunda_vez" | "mas_de_tres";

export interface NuevoStandInput {
  codigo: string;
  nombre: string | null;
  pabellon: Pabellon | null;
  tipo_stand: TipoStand | null;
  tamano: string | null;
  precio: number;
  valor_sin_iva: number | null;
  valor_con_iva: number | null;
}

// Alta manual de un stand nuevo (ej. zona ampliada que no estaba en el
// control original). `codigo` es unique en la tabla; el error de duplicado
// de Postgres (23505) se traduce a un mensaje entendible en el panel.
export async function crearStand(
  input: NuevoStandInput,
): Promise<AccionResult> {
  if (!(await puedeGestionarComercialStands())) return SIN_PERMISO_COMERCIAL;
  const codigo = input.codigo.trim();
  if (!codigo) {
    return { ok: false, mensaje: "El código del stand es obligatorio." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("stands").insert({
    codigo,
    nombre: input.nombre,
    pabellon: input.pabellon,
    tipo_stand: input.tipo_stand,
    tamano: input.tamano,
    precio: input.precio,
    valor_sin_iva: input.valor_sin_iva,
    valor_con_iva: input.valor_con_iva,
  });
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        mensaje: `Ya existe un stand con el código "${codigo}".`,
      };
    }
    return { ok: false, mensaje: error.message };
  }
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}

export interface DatosComercialesStandInput {
  nombre: string | null;
  pabellon: Pabellon | null;
  tipo_stand: TipoStand | null;
  tamano: string | null;
  categoria_cliente: CategoriaCliente | null;
  ciudad: string | null;
  nombre_fiscal: string | null;
  nombre_persona_encargada: string | null;
  id_effi: string | null;
  asesor_id: string | null;
  precio: number;
  valor_sin_iva: number | null;
  valor_con_iva: number | null;
  precio_venta: number | null;
  forma_pago_restante: FormaPagoRestante | null;
  primera_vez_en_feria: FrecuenciaParticipacion | null;
  numero_factura: string | null;
  fecha_venta: string | null;
  observaciones_venta: string | null;
  observaciones_facturacion: string | null;
  obsequio_de: string | null;
  directorio_pais: string | null;
  directorio_direccion: string | null;
  directorio_telefono: string | null;
  directorio_email: string | null;
  directorio_sitio_web: string | null;
  directorio_descripcion: string | null;
  directorio_redes_sociales: string | null;
}

// Edición completa de los datos comerciales/de cliente de un stand ya
// existente (distinto de cambiarEstadoStand, que solo maneja el estado
// operativo del mapa público).
export async function actualizarStandComercial(
  standId: string,
  input: DatosComercialesStandInput,
): Promise<AccionResult> {
  if (!(await puedeGestionarComercialStands())) return SIN_PERMISO_COMERCIAL;
  const supabase = await createClient();
  const { error } = await supabase
    .from("stands")
    .update(input)
    .eq("id", standId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}

// Fusiona 2+ stands físicos vendidos como una sola unidad comercial: los
// `secundarioIds` quedan referenciando a `principalId` vía
// stands.stand_principal_id y dejan de tratarse como venta independiente.
// No se permiten cadenas (un secundario no puede tener a su vez secundarios,
// ni el principal puede ya ser secundario de otro stand) para que la
// relación "principal -> secundarios" quede siempre en un solo nivel.
export async function fusionarStands(
  principalId: string,
  secundarioIds: string[],
): Promise<AccionResult> {
  if (!(await puedeGestionarComercialStands())) return SIN_PERMISO_COMERCIAL;
  const ids = secundarioIds.filter((id) => id !== principalId);
  if (ids.length === 0) {
    return {
      ok: false,
      mensaje: "Elegí al menos un stand secundario distinto del principal.",
    };
  }

  const supabase = await createClient();

  const { data: relacionados, error: errorRelacionados } = await supabase
    .from("stands")
    .select("id, codigo, stand_principal_id")
    .in("id", [principalId, ...ids]);
  if (errorRelacionados) {
    return { ok: false, mensaje: errorRelacionados.message };
  }

  const principal = relacionados?.find((s) => s.id === principalId);
  if (!principal) {
    return { ok: false, mensaje: "No se encontró el stand principal." };
  }
  if (principal.stand_principal_id) {
    return {
      ok: false,
      mensaje: `El stand ${principal.codigo} ya está fusionado dentro de otro stand; elegí otro como principal.`,
    };
  }
  const secundarioYaFusionado = relacionados?.find(
    (s) => ids.includes(s.id) && s.stand_principal_id,
  );
  if (secundarioYaFusionado) {
    return {
      ok: false,
      mensaje: `El stand ${secundarioYaFusionado.codigo} ya está fusionado dentro de otro stand.`,
    };
  }

  const { data: conHijos, error: errorHijos } = await supabase
    .from("stands")
    .select("codigo")
    .in("stand_principal_id", ids)
    .limit(1);
  if (errorHijos) return { ok: false, mensaje: errorHijos.message };
  if (conHijos && conHijos.length > 0) {
    return {
      ok: false,
      mensaje: `El stand ${conHijos[0].codigo} ya tiene stands fusionados dentro de él y no puede fusionarse como secundario de otro.`,
    };
  }

  const { error } = await supabase
    .from("stands")
    .update({ stand_principal_id: principalId })
    .in("id", ids);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}

// Deshace la fusión de un stand secundario: vuelve a tratarse como venta
// independiente.
export async function desfusionarStand(standId: string): Promise<AccionResult> {
  if (!(await puedeGestionarComercialStands())) return SIN_PERMISO_COMERCIAL;
  const supabase = await createClient();
  const { error } = await supabase
    .from("stands")
    .update({ stand_principal_id: null })
    .eq("id", standId);
  if (error) return { ok: false, mensaje: error.message };
  revalidatePath("/panel/stands");
  revalidatePath("/mapa-stands");
  return { ok: true };
}
