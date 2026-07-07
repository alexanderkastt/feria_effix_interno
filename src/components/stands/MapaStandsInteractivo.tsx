"use client";

import { useState, useTransition } from "react";
import { reservarStand, confirmarReserva } from "@/app/mapa-stands/actions";

export type Pabellon =
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

export type TipoStand = "isla" | "tipo_u" | "esquinero" | "lineal";

export interface StandPublico {
  id: string;
  codigo: string;
  nombre: string | null;
  tamano: string | null;
  precio: number;
  estado: "disponible" | "bloqueado_temporal" | "reservado" | "vendido";
  bloqueado_hasta: string | null;
  pabellon: Pabellon;
  tipo_stand: TipoStand | null;
  valor_con_iva: number | null;
}

const PABELLON_LABEL: Record<Pabellon, string> = {
  azul: "Azul",
  amarillo: "Amarillo",
  blanco: "Blanco",
  rojo: "Rojo",
  zona_comidas: "Zona de Comidas",
  burbujas: "Burbujas",
  gran_salon: "Gran Salón",
  plazoleta: "Plazoleta",
  hall_verde: "Hall Verde",
  hall: "Hall",
};

const PABELLON_OPCIONES: Pabellon[] = [
  "azul",
  "amarillo",
  "blanco",
  "rojo",
  "zona_comidas",
  "burbujas",
  "gran_salon",
  "plazoleta",
  "hall_verde",
  "hall",
];

const TIPO_STAND_LABEL: Record<TipoStand, string> = {
  isla: "Isla",
  tipo_u: "Tipo U",
  esquinero: "Esquinero",
  lineal: "Lineal",
};

const ESTADO_STYLE: Record<StandPublico["estado"], string> = {
  disponible:
    "border-brand/50 bg-brand-soft/20 text-foreground hover:bg-brand-soft/40 cursor-pointer",
  bloqueado_temporal: "border-warn/50 bg-warn/10 text-warn cursor-not-allowed",
  reservado: "border-warn/50 bg-warn/10 text-warn cursor-not-allowed",
  vendido: "border-border bg-surface-2 text-muted cursor-not-allowed",
};

const ESTADO_LABEL: Record<StandPublico["estado"], string> = {
  disponible: "Disponible",
  bloqueado_temporal: "Bloqueado",
  reservado: "Reservado",
  vendido: "Vendido",
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

type Paso = "detalle" | "form" | "listo";

export function MapaStandsInteractivo({ stands }: { stands: StandPublico[] }) {
  const [sel, setSel] = useState<StandPublico | null>(null);
  const [paso, setPaso] = useState<Paso>("detalle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [zona, setZona] = useState<Pabellon | "todas">("todas");

  const standsFiltrados =
    zona === "todas" ? stands : stands.filter((s) => s.pabellon === zona);

  function abrir(s: StandPublico) {
    if (s.estado !== "disponible") return;
    setSel(s);
    setPaso("detalle");
    setError("");
  }

  function cerrar() {
    setSel(null);
    setError("");
  }

  function iniciarReserva() {
    if (!sel) return;
    setError("");
    startTransition(async () => {
      const r = await reservarStand(sel.id);
      if (r.ok) setPaso("form");
      else setError(r.mensaje ?? "No se pudo reservar.");
    });
  }

  function enviarDatos(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sel) return;
    const fd = new FormData(e.currentTarget);
    setError("");
    startTransition(async () => {
      const r = await confirmarReserva({
        id: sel.id,
        nombre: String(fd.get("nombre") ?? ""),
        email: String(fd.get("email") ?? ""),
        telefono: String(fd.get("telefono") ?? ""),
      });
      if (r.ok) setPaso("listo");
      else setError(r.mensaje ?? "No se pudo confirmar.");
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setZona("todas")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            zona === "todas"
              ? "border-brand bg-brand text-white"
              : "border-border text-muted hover:border-brand/60 hover:text-foreground"
          }`}
        >
          Todas las zonas
        </button>
        {PABELLON_OPCIONES.map((p) => (
          <button
            key={p}
            onClick={() => setZona(p)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              zona === p
                ? "border-brand bg-brand text-white"
                : "border-border text-muted hover:border-brand/60 hover:text-foreground"
            }`}
          >
            {PABELLON_LABEL[p]}
          </button>
        ))}
      </div>

      {standsFiltrados.length === 0 && (
        <p className="rounded-lg border border-border bg-surface-2 px-4 py-6 text-center text-sm text-muted">
          No hay stands cargados para esta zona.
        </p>
      )}

      <div className="grid grid-cols-4 gap-3">
        {standsFiltrados.map((s) => (
          <button
            key={s.id}
            onClick={() => abrir(s)}
            disabled={s.estado !== "disponible"}
            className={`grid aspect-square place-items-center rounded-lg border text-center text-sm font-semibold transition-colors ${ESTADO_STYLE[s.estado]}`}
            title={`${s.codigo} · ${ESTADO_LABEL[s.estado]}`}
          >
            <span>
              {s.codigo}
              <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                {ESTADO_LABEL[s.estado]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted">
        <Leyenda clase="bg-brand/40" label="Disponible" />
        <Leyenda clase="bg-warn/30" label="Reservado / Bloqueado" />
        <Leyenda clase="bg-surface-2 border border-border" label="Vendido" />
      </div>

      {sel && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={cerrar}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {paso === "detalle" && (
              <>
                <h2 className="text-lg font-semibold">Stand {sel.codigo}</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row k="Ubicación" v={sel.nombre ?? "—"} />
                  <Row k="Zona" v={PABELLON_LABEL[sel.pabellon]} />
                  <Row k="Tamaño" v={sel.tamano ?? "—"} />
                  {sel.tipo_stand && (
                    <Row
                      k="Tipo de stand"
                      v={TIPO_STAND_LABEL[sel.tipo_stand]}
                    />
                  )}
                  <Row
                    k="Precio (IVA incluido)"
                    v={fmtCOP(sel.valor_con_iva ?? sel.precio)}
                  />
                </dl>
                {error && <Aviso msg={error} />}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={cerrar}
                    className="flex-1 rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={iniciarReserva}
                    disabled={pending}
                    className="flex-1 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
                  >
                    {pending ? "Reservando…" : "Reservar"}
                  </button>
                </div>
              </>
            )}

            {paso === "form" && (
              <>
                <h2 className="text-lg font-semibold">
                  Reservá el stand {sel.codigo}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Tenés 30 minutos para completar tus datos. Dejanos tu contacto
                  y el equipo comercial te escribe.
                </p>
                <form onSubmit={enviarDatos} className="mt-4 space-y-3">
                  <Input name="nombre" label="Nombre / empresa" />
                  <Input name="email" label="Correo" type="email" />
                  <Input name="telefono" label="Teléfono" />
                  {error && <Aviso msg={error} />}
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
                  >
                    {pending ? "Confirmando…" : "Confirmar reserva"}
                  </button>
                </form>
              </>
            )}

            {paso === "listo" && (
              <>
                <h2 className="text-lg font-semibold text-ok">
                  ¡Reserva confirmada!
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Guardamos tu reserva del stand {sel.codigo}. El equipo
                  comercial de Feria Effix te contactará para cerrar el pago.
                </p>
                <button
                  onClick={cerrar}
                  className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-1">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function Input({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </div>
  );
}

function Aviso({ msg }: { msg: string }) {
  return (
    <p className="mt-3 rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
      {msg}
    </p>
  );
}

function Leyenda({ clase, label }: { clase: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded ${clase}`} />
      {label}
    </span>
  );
}
