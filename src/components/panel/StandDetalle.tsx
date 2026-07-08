"use client";

import { useState, useTransition, type TransitionStartFunction } from "react";
import {
  actualizarChecklistStand,
  actualizarStandComercial,
  registrarPago,
  type ChecklistCampoStand,
  type DatosComercialesStandInput,
} from "@/app/panel/stands/actions";
import { StandAvatar } from "@/components/StandAvatar";
import {
  Campo,
  PrecioStandEditor,
  usePrecioStand,
} from "@/components/panel/stands-precio";
import {
  CATEGORIA_LABEL,
  ESTADO_VENTA_LABEL,
  ESTADO_VENTA_STYLE,
  FORMA_PAGO_LABEL,
  FRECUENCIA_LABEL,
  MEDIO_PAGO_LABEL,
  PABELLON_LABEL,
  TIPO_PAGO_LABEL,
  TIPO_STAND_LABEL,
  fmtCOP,
  formatearTamano,
  formatearValorHistorial,
  labelCampoHistorial,
  parsearTamano,
  type AsesorOption,
  type CategoriaCliente,
  type FormaPagoRestante,
  type FrecuenciaParticipacion,
  type HistorialEntradaView,
  type MedioPago,
  type Pabellon,
  type PagoStandView,
  type StandView,
  type TipoPagoStand,
  type TipoStand,
} from "@/components/panel/stands-shared";

const PABELLONES = Object.keys(PABELLON_LABEL) as Pabellon[];
const TIPOS_STAND = Object.keys(TIPO_STAND_LABEL) as TipoStand[];
const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as CategoriaCliente[];
const FORMAS_PAGO = Object.keys(FORMA_PAGO_LABEL) as FormaPagoRestante[];
const FRECUENCIAS = Object.keys(FRECUENCIA_LABEL) as FrecuenciaParticipacion[];

const CHECKLIST_ITEMS: { campo: ChecklistCampoStand; label: string }[] = [
  { campo: "contrato_entregado", label: "Contrato entregado" },
  { campo: "manual_entregado", label: "Manual entregado" },
  { campo: "logo_recibido", label: "Logo recibido" },
  { campo: "marcado_en_mapa", label: "Marcado en mapa" },
  { campo: "publicado_web", label: "Publicado en web" },
  { campo: "imagen_enviada", label: "Imagen enviada" },
  {
    campo: "formulario_directorio_lleno",
    label: "Formulario de directorio lleno",
  },
  { campo: "paz_y_salvo", label: "Paz y salvo" },
];

const MEDIOS_PAGO = Object.keys(MEDIO_PAGO_LABEL) as MedioPago[];
const TIPOS_PAGO = Object.keys(TIPO_PAGO_LABEL) as TipoPagoStand[];

export function StandDetalle({
  stand,
  pagos,
  historial,
  asesores,
  puedeEditar,
  puedeEditarComercial,
  onCerrar,
}: {
  stand: StandView;
  pagos: PagoStandView[];
  historial: HistorialEntradaView[];
  asesores: AsesorOption[];
  puedeEditar: boolean;
  puedeEditarComercial: boolean;
  onCerrar: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-3xl space-y-6 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <StandAvatar
              logoUrl={stand.logo_url}
              nombre={stand.nombre}
              size={48}
            />
            <div>
              <h2 className="text-lg font-semibold">
                Stand {stand.codigo}{" "}
                <span className="text-muted">— {stand.nombre ?? "—"}</span>
              </h2>
              <p className="text-sm text-muted">
                {stand.pabellon ? PABELLON_LABEL[stand.pabellon] : "Sin zona"} ·{" "}
                {stand.tipo_stand
                  ? TIPO_STAND_LABEL[stand.tipo_stand]
                  : "Tipo sin definir"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {puedeEditarComercial && !editando && (
              <button
                onClick={() => setEditando(true)}
                className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
              >
                Editar datos
              </button>
            )}
            <button
              onClick={onCerrar}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-brand hover:text-brand"
            >
              Cerrar
            </button>
          </div>
        </div>

        <LinkPublicoStand stand={stand} />

        {editando ? (
          <EditarDatosComercialesForm
            stand={stand}
            asesores={asesores}
            onGuardado={() => setEditando(false)}
            onCancelar={() => setEditando(false)}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoCard titulo="Cliente">
                <Dato label="Nombre fiscal" valor={stand.nombre_fiscal} />
                <Dato
                  label="Persona encargada"
                  valor={stand.nombre_persona_encargada}
                />
                <Dato label="Ciudad" valor={stand.ciudad} />
                <Dato
                  label="Categoría"
                  valor={
                    stand.categoria_cliente
                      ? CATEGORIA_LABEL[stand.categoria_cliente]
                      : null
                  }
                />
                <Dato label="Asesor" valor={stand.asesor_nombre} />
                <Dato label="ID Effi" valor={stand.id_effi} />
                <Dato
                  label="Frecuencia en feria"
                  valor={
                    stand.primera_vez_en_feria
                      ? FRECUENCIA_LABEL[stand.primera_vez_en_feria]
                      : null
                  }
                />
              </InfoCard>

              <InfoCard titulo="Comercial">
                <div className="flex items-center justify-between py-1 text-sm">
                  <span className="text-muted">Estado de venta</span>
                  {stand.estado_venta ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${ESTADO_VENTA_STYLE[stand.estado_venta]}`}
                    >
                      {ESTADO_VENTA_LABEL[stand.estado_venta]}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
                {stand.estado_venta === "obsequio_directivo" && (
                  <Dato label="Obsequio de" valor={stand.obsequio_de} />
                )}
                <Dato
                  label="Tarifa"
                  valor={
                    stand.tarifa_zona_comidas
                      ? "Zona de comidas ($400.000/m²)"
                      : "Comercial ($700.000/m²)"
                  }
                />
                <Dato
                  label="Valor sin IVA"
                  valor={
                    stand.valor_sin_iva != null
                      ? fmtCOP(stand.valor_sin_iva)
                      : null
                  }
                />
                <Dato
                  label="Valor con IVA"
                  valor={
                    stand.valor_con_iva != null
                      ? fmtCOP(stand.valor_con_iva)
                      : null
                  }
                />
                <Dato
                  label="Precio de venta"
                  valor={
                    stand.precio_venta != null
                      ? fmtCOP(stand.precio_venta)
                      : null
                  }
                />
                <Dato
                  label="Forma de pago restante"
                  valor={
                    stand.forma_pago_restante
                      ? FORMA_PAGO_LABEL[stand.forma_pago_restante]
                      : null
                  }
                />
                <Dato label="Fecha de venta" valor={stand.fecha_venta} />
                <Dato label="N.º factura" valor={stand.numero_factura} />
              </InfoCard>
            </div>

            <InfoCard titulo="Observaciones">
              <Dato label="De venta" valor={stand.observaciones_venta} bloque />
              <Dato
                label="De facturación"
                valor={stand.observaciones_facturacion}
                bloque
              />
            </InfoCard>

            <InfoCard
              titulo={`Directorio de marcas ${stand.formulario_directorio_lleno ? "✓ completo" : "· pendiente"}`}
            >
              <Dato label="País" valor={stand.directorio_pais} />
              <Dato label="Dirección" valor={stand.directorio_direccion} />
              <Dato label="Teléfono" valor={stand.directorio_telefono} />
              <Dato label="Email" valor={stand.directorio_email} />
              <Dato label="Sitio web" valor={stand.directorio_sitio_web} />
              <Dato label="Instagram" valor={stand.directorio_instagram} />
              <Dato label="Facebook" valor={stand.directorio_facebook} />
              <Dato label="TikTok" valor={stand.directorio_tiktok} />
              <Dato label="LinkedIn" valor={stand.directorio_linkedin} />
              <Dato
                label="Descripción"
                valor={stand.directorio_descripcion}
                bloque
              />
            </InfoCard>
          </>
        )}

        <ChecklistOperativo
          stand={stand}
          puedeEditar={puedeEditar}
          pending={pending}
          startTransition={startTransition}
        />

        <PlanDePagos
          stand={stand}
          pagos={pagos}
          puedeEditar={puedeEditarComercial}
        />

        <HistorialCambios historial={historial} />
      </div>
    </div>
  );
}

function InfoCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {titulo}
      </h3>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function Dato({
  label,
  valor,
  bloque,
}: {
  label: string;
  valor: string | null;
  bloque?: boolean;
}) {
  if (bloque) {
    return (
      <div className="py-1.5 text-sm">
        <p className="text-muted">{label}</p>
        <p className="mt-0.5">{valor ?? "—"}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span>{valor ?? "—"}</span>
    </div>
  );
}

function ChecklistOperativo({
  stand,
  puedeEditar,
  pending,
  startTransition,
}: {
  stand: StandView;
  puedeEditar: boolean;
  pending: boolean;
  startTransition: TransitionStartFunction;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Checklist operativo
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {CHECKLIST_ITEMS.map((item) => {
          const activo = stand[item.campo];
          return (
            <button
              key={item.campo}
              type="button"
              disabled={!puedeEditar || pending}
              onClick={() =>
                startTransition(async () => {
                  await actualizarChecklistStand(stand.id, item.campo, !activo);
                })
              }
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                activo
                  ? "border-ok/50 bg-ok/10 text-ok"
                  : "border-border bg-surface text-muted"
              } ${puedeEditar ? "hover:border-brand" : "cursor-default"}`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  activo ? "border-ok bg-ok text-black" : "border-border"
                }`}
              >
                {activo ? "✓" : ""}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlanDePagos({
  stand,
  pagos,
  puedeEditar,
}: {
  stand: StandView;
  pagos: PagoStandView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Plan de pagos
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            Saldo pendiente:{" "}
            <span className="font-semibold text-warn">
              {fmtCOP(stand.valor_restante)}
            </span>
          </span>
          {puedeEditar && (
            <button
              onClick={() => setAbrir((v) => !v)}
              className="rounded-md bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-strong"
            >
              {abrir ? "Cancelar" : "+ Registrar abono"}
            </button>
          )}
        </div>
      </div>

      {abrir && puedeEditar && (
        <NuevoPagoForm standId={stand.id} onGuardado={() => setAbrir(false)} />
      )}

      {pagos.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted">
          Sin abonos registrados.
        </p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 font-medium">Fecha</th>
              <th className="pb-2 font-medium">Tipo</th>
              <th className="pb-2 font-medium">Medio de pago</th>
              <th className="pb-2 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {pagos
              .slice()
              .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
              .map((p) => (
                <tr key={p.id} className="border-b border-border/40">
                  <td className="py-2">{p.fecha}</td>
                  <td className="py-2 text-muted">
                    {p.tipo_pago ? TIPO_PAGO_LABEL[p.tipo_pago] : "—"}
                  </td>
                  <td className="py-2 text-muted">
                    {p.medio_pago ? MEDIO_PAGO_LABEL[p.medio_pago] : "—"}
                  </td>
                  <td className="py-2 text-right">{fmtCOP(p.monto)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Auditoría genérica: una fila por cada campo que cambió (poblada por
// trigger de base de datos, ver migración stands_historial). Incluye
// __creacion__ como primer evento del stand. Sirve también como fuente de
// fechas (ej. "cuándo pasó a reservado" = creado_en de esa fila) sin
// necesidad de columnas de fecha dedicadas por hito.
function HistorialCambios({
  historial,
}: {
  historial: HistorialEntradaView[];
}) {
  const [mostrarTodo, setMostrarTodo] = useState(false);
  const visibles = mostrarTodo ? historial : historial.slice(0, 15);

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        Historial de cambios
      </h3>
      {historial.length === 0 ? (
        <p className="py-3 text-center text-sm text-muted">
          Sin cambios registrados todavía.
        </p>
      ) : (
        <>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {visibles.map((h) => (
              <div
                key={h.id}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{labelCampoHistorial(h.campo)}</span>
                  <span>
                    {new Date(h.creado_en).toLocaleString("es-CO")} ·{" "}
                    {h.usuario_nombre ?? "Sistema"}
                  </span>
                </div>
                {h.campo === "__creacion__" ? (
                  <p className="mt-1">
                    Stand creado (
                    {formatearValorHistorial(h.campo, h.valor_nuevo)})
                  </p>
                ) : (
                  <p className="mt-1">
                    <span className="text-muted line-through">
                      {formatearValorHistorial(h.campo, h.valor_anterior)}
                    </span>{" "}
                    →{" "}
                    <span className="font-medium">
                      {formatearValorHistorial(h.campo, h.valor_nuevo)}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
          {historial.length > 15 && (
            <button
              type="button"
              onClick={() => setMostrarTodo((v) => !v)}
              className="mt-2 text-xs text-brand hover:underline"
            >
              {mostrarTodo
                ? "Ver menos"
                : `Ver los ${historial.length} cambios`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

function NuevoPagoForm({
  standId,
  onGuardado,
}: {
  standId: string;
  onGuardado: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [medioPago, setMedioPago] = useState<MedioPago>(MEDIOS_PAGO[0]);
  const [tipoPago, setTipoPago] = useState<TipoPagoStand>(TIPOS_PAGO[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const montoNum = Number(monto);
    if (!montoNum || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await registrarPago(standId, {
        monto: montoNum,
        fecha,
        medio_pago: medioPago,
        tipo_pago: tipoPago,
      });
      if (r.ok) {
        setMonto("");
        onGuardado();
      } else {
        setError(r.mensaje ?? "No se pudo registrar el abono.");
      }
    });
  }

  return (
    <form
      onSubmit={guardar}
      className="mb-4 grid gap-2 rounded-md border border-border bg-surface p-3 sm:grid-cols-4"
    >
      <input
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="Monto (COP)"
        type="number"
        min="0"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        type="date"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <select
        value={tipoPago}
        onChange={(e) => setTipoPago(e.target.value as TipoPagoStand)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {TIPOS_PAGO.map((t) => (
          <option key={t} value={t}>
            {TIPO_PAGO_LABEL[t]}
          </option>
        ))}
      </select>
      <select
        value={medioPago}
        onChange={(e) => setMedioPago(e.target.value as MedioPago)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {MEDIOS_PAGO.map((m) => (
          <option key={m} value={m}>
            {MEDIO_PAGO_LABEL[m]}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger sm:col-span-4">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-4"
      >
        {pending ? "Guardando…" : "Guardar abono"}
      </button>
    </form>
  );
}

// Edita cliente/comercial/facturación de un stand. La sección de precio
// arranca en modo "manual" precargada con el valor ya guardado (si existe)
// para que abrir y guardar sin tocarla nunca modifique el precio de un stand
// ya negociado; el modo "Estándar"/"Descuento" solo recalcula si el usuario
// lo elige a propósito (ej. después de cambiar el tamaño de un disponible).
function EditarDatosComercialesForm({
  stand,
  asesores,
  onGuardado,
  onCancelar,
}: {
  stand: StandView;
  asesores: AsesorOption[];
  onGuardado: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(stand.nombre ?? "");
  const [pabellon, setPabellon] = useState<Pabellon | "">(stand.pabellon ?? "");
  const [tipoStand, setTipoStand] = useState<TipoStand | "">(
    stand.tipo_stand ?? "",
  );
  const tamanoInicial = parsearTamano(stand.tamano);
  const [ancho, setAncho] = useState(tamanoInicial.ancho);
  const [fondo, setFondo] = useState(tamanoInicial.fondo);
  const [categoriaCliente, setCategoriaCliente] = useState<
    CategoriaCliente | ""
  >(stand.categoria_cliente ?? "");
  const [ciudad, setCiudad] = useState(stand.ciudad ?? "");
  const [nombreFiscal, setNombreFiscal] = useState(stand.nombre_fiscal ?? "");
  const [nombrePersonaEncargada, setNombrePersonaEncargada] = useState(
    stand.nombre_persona_encargada ?? "",
  );
  const [idEffi, setIdEffi] = useState(stand.id_effi ?? "");
  const [asesorId, setAsesorId] = useState(stand.asesor_id ?? "");
  const [precioVenta, setPrecioVenta] = useState(
    stand.precio_venta != null ? String(stand.precio_venta) : "",
  );
  const [formaPagoRestante, setFormaPagoRestante] = useState<
    FormaPagoRestante | ""
  >(stand.forma_pago_restante ?? "");
  const [primeraVez, setPrimeraVez] = useState<FrecuenciaParticipacion | "">(
    stand.primera_vez_en_feria ?? "",
  );
  const [numeroFactura, setNumeroFactura] = useState(
    stand.numero_factura ?? "",
  );
  const [fechaVenta, setFechaVenta] = useState(stand.fecha_venta ?? "");
  const [obsequioDe, setObsequioDe] = useState(stand.obsequio_de ?? "");
  const [observacionesVenta, setObservacionesVenta] = useState(
    stand.observaciones_venta ?? "",
  );
  const [observacionesFacturacion, setObservacionesFacturacion] = useState(
    stand.observaciones_facturacion ?? "",
  );
  const [directorioPais, setDirectorioPais] = useState(
    stand.directorio_pais ?? "",
  );
  const [directorioDireccion, setDirectorioDireccion] = useState(
    stand.directorio_direccion ?? "",
  );
  const [directorioTelefono, setDirectorioTelefono] = useState(
    stand.directorio_telefono ?? "",
  );
  const [directorioEmail, setDirectorioEmail] = useState(
    stand.directorio_email ?? "",
  );
  const [directorioSitioWeb, setDirectorioSitioWeb] = useState(
    stand.directorio_sitio_web ?? "",
  );
  const [directorioDescripcion, setDirectorioDescripcion] = useState(
    stand.directorio_descripcion ?? "",
  );
  const [directorioInstagram, setDirectorioInstagram] = useState(
    stand.directorio_instagram ?? "",
  );
  const [directorioFacebook, setDirectorioFacebook] = useState(
    stand.directorio_facebook ?? "",
  );
  const [directorioTiktok, setDirectorioTiktok] = useState(
    stand.directorio_tiktok ?? "",
  );
  const [directorioLinkedin, setDirectorioLinkedin] = useState(
    stand.directorio_linkedin ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tamano = formatearTamano(ancho, fondo) ?? "";
  const precio = usePrecioStand(tamano, {
    modo: stand.valor_sin_iva != null ? "manual" : "estandar",
    manualSinIva: stand.valor_sin_iva,
    esZonaComidas: stand.tarifa_zona_comidas,
  });

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: DatosComercialesStandInput = {
      nombre: nombre.trim() || null,
      pabellon: pabellon || null,
      tipo_stand: tipoStand || null,
      tamano: tamano || null,
      tarifa_zona_comidas: precio.esZonaComidas,
      categoria_cliente: categoriaCliente || null,
      ciudad: ciudad.trim() || null,
      nombre_fiscal: nombreFiscal.trim() || null,
      nombre_persona_encargada: nombrePersonaEncargada.trim() || null,
      id_effi: idEffi.trim() || null,
      asesor_id: asesorId || null,
      precio: precio.valorConIva ?? stand.precio,
      valor_sin_iva: precio.valorSinIva,
      valor_con_iva: precio.valorConIva,
      precio_venta: precioVenta ? Number(precioVenta) : null,
      forma_pago_restante: formaPagoRestante || null,
      primera_vez_en_feria: primeraVez || null,
      numero_factura: numeroFactura.trim() || null,
      fecha_venta: fechaVenta || null,
      observaciones_venta: observacionesVenta.trim() || null,
      observaciones_facturacion: observacionesFacturacion.trim() || null,
      obsequio_de: obsequioDe.trim() || null,
      directorio_pais: directorioPais.trim() || null,
      directorio_direccion: directorioDireccion.trim() || null,
      directorio_telefono: directorioTelefono.trim() || null,
      directorio_email: directorioEmail.trim() || null,
      directorio_sitio_web: directorioSitioWeb.trim() || null,
      directorio_descripcion: directorioDescripcion.trim() || null,
      directorio_instagram: directorioInstagram.trim() || null,
      directorio_facebook: directorioFacebook.trim() || null,
      directorio_tiktok: directorioTiktok.trim() || null,
      directorio_linkedin: directorioLinkedin.trim() || null,
    };
    startTransition(async () => {
      const r = await actualizarStandComercial(stand.id, input);
      if (r.ok) onGuardado();
      else setError(r.mensaje ?? "No se pudieron guardar los cambios.");
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cliente
          </h3>
          <Campo label="Nombre comercial">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Nombre fiscal">
            <input
              value={nombreFiscal}
              onChange={(e) => setNombreFiscal(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Persona encargada">
            <input
              value={nombrePersonaEncargada}
              onChange={(e) => setNombrePersonaEncargada(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Ciudad">
              <input
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
            <Campo label="ID Effi">
              <input
                value={idEffi}
                onChange={(e) => setIdEffi(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Categoría">
              <select
                value={categoriaCliente}
                onChange={(e) =>
                  setCategoriaCliente(e.target.value as CategoriaCliente | "")
                }
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">— Sin definir —</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIA_LABEL[c]}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Frecuencia en feria">
              <select
                value={primeraVez}
                onChange={(e) =>
                  setPrimeraVez(e.target.value as FrecuenciaParticipacion | "")
                }
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              >
                <option value="">— Sin definir —</option>
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {FRECUENCIA_LABEL[f]}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
          <Campo label="Asesor comercial">
            <select
              value={asesorId}
              onChange={(e) => setAsesorId(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— Sin asignar —</option>
              {asesores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_completo}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Stand y comercial
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Pabellón">
              <select
                value={pabellon}
                onChange={(e) => setPabellon(e.target.value as Pabellon | "")}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
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
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
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
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
            <Campo label="Fondo (m)">
              <input
                value={fondo}
                onChange={(e) => setFondo(e.target.value)}
                type="number"
                min="0"
                step="0.1"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
          </div>

          <PrecioStandEditor precio={precio} />

          <Campo label="Precio de venta real (negociado)">
            <input
              value={precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value)}
              type="number"
              min="0"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Forma de pago restante">
            <select
              value={formaPagoRestante}
              onChange={(e) =>
                setFormaPagoRestante(e.target.value as FormaPagoRestante | "")
              }
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">— Sin definir —</option>
              {FORMAS_PAGO.map((f) => (
                <option key={f} value={f}>
                  {FORMA_PAGO_LABEL[f]}
                </option>
              ))}
            </select>
          </Campo>
          {stand.estado_venta === "obsequio_directivo" && (
            <Campo label="Obsequio de">
              <input
                value={obsequioDe}
                onChange={(e) => setObsequioDe(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Fecha de venta">
              <input
                value={fechaVenta ?? ""}
                onChange={(e) => setFechaVenta(e.target.value)}
                type="date"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
            <Campo label="N.º factura">
              <input
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </Campo>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Observaciones de venta">
          <textarea
            value={observacionesVenta}
            onChange={(e) => setObservacionesVenta(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
        <Campo label="Observaciones de facturación">
          <textarea
            value={observacionesFacturacion}
            onChange={(e) => setObservacionesFacturacion(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
      </div>

      <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Directorio de marcas{" "}
          {stand.formulario_directorio_lleno ? "✓ completo" : "· pendiente"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo label="País">
            <input
              value={directorioPais}
              onChange={(e) => setDirectorioPais(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Dirección">
            <input
              value={directorioDireccion}
              onChange={(e) => setDirectorioDireccion(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Teléfono de contacto">
            <input
              value={directorioTelefono}
              onChange={(e) => setDirectorioTelefono(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Email de contacto">
            <input
              type="email"
              value={directorioEmail}
              onChange={(e) => setDirectorioEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Sitio web">
            <input
              value={directorioSitioWeb}
              onChange={(e) => setDirectorioSitioWeb(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Instagram">
            <input
              value={directorioInstagram}
              onChange={(e) => setDirectorioInstagram(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="Facebook">
            <input
              value={directorioFacebook}
              onChange={(e) => setDirectorioFacebook(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="TikTok">
            <input
              value={directorioTiktok}
              onChange={(e) => setDirectorioTiktok(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
          <Campo label="LinkedIn">
            <input
              value={directorioLinkedin}
              onChange={(e) => setDirectorioLinkedin(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </Campo>
        </div>
        <Campo label="Descripción de la marca (describila como querés que la conozcan)">
          <textarea
            value={directorioDescripcion}
            onChange={(e) => setDirectorioDescripcion(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function LinkPublicoStand({ stand }: { stand: StandView }) {
  const [copiado, setCopiado] = useState(false);

  // Este modal solo se monta client-side en respuesta a un click (nunca en
  // el HTML del servidor), así que leer window acá no genera mismatch de
  // hidratación.
  const url = `${window.location.origin}/mi-stand/${stand.token_publico}`;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2 text-sm">
      <StandAvatar logoUrl={stand.logo_url} nombre={stand.nombre} size={32} />
      <span className="text-muted">
        Link para el cliente (solo lectura + carga de logo):
      </span>
      <code className="truncate rounded bg-surface px-2 py-1 text-xs">
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
        className="rounded-md border border-border px-2 py-1 text-xs text-brand hover:border-brand"
      >
        {copiado ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
