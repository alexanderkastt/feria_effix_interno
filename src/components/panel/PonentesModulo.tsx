"use client";

import { useMemo, useState, useTransition } from "react";
import {
  crearPonenteManual,
  editarPonente,
  moverEtapaPonente,
  type EstadoPonente,
  type PonenteDatos,
} from "@/app/panel/ponentes/actions";
import {
  KanbanInteractive,
  type TareaView,
  type TransversalView,
} from "@/components/panel/KanbanInteractive";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface PonenteView {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  cargo: string | null;
  empresa: string | null;
  ciudad_pais: string | null;
  foto_url: string | null;
  tema_propuesto: string;
  formato_participacion: string;
  experiencia_previa: string | null;
  bio: string | null;
  video_url: string | null;
  ig: string | null;
  tiktok: string | null;
  linkedin: string | null;
  facebook: string | null;
  youtube: string | null;
  notas_internas: string | null;
  estado: EstadoPonente;
  origen: string | null;
  creado_en: string;
}

const ETAPAS: { key: EstadoPonente; label: string }[] = [
  { key: "prospecto", label: "Prospecto" },
  { key: "contactado", label: "Contactado" },
  { key: "pendiente_revision", label: "En revisión" },
  { key: "mas_info", label: "Más info" },
  { key: "aceptado", label: "Aceptado" },
  { key: "confirmado", label: "Confirmado" },
  { key: "agendado", label: "Agendado" },
];

// El pipeline incluye 'rechazado' como una etapa más ("Descartado").
const ETAPAS_FULL: { key: string; label: string }[] = [
  ...ETAPAS,
  { key: "rechazado", label: "Descartado" },
];

const FORMATOS: { value: string; label: string }[] = [
  { value: "ponencia_general", label: "Ponencia general" },
  { value: "conversatorio", label: "Conversatorio" },
  { value: "workshop", label: "Workshop" },
  { value: "pregunta_en_vivo", label: "Pregunta en vivo" },
  { value: "live_selling", label: "Live selling" },
];
const FMT_LABEL = Object.fromEntries(FORMATOS.map((f) => [f.value, f.label]));

const REDES: { key: keyof PonenteView; label: string }[] = [
  { key: "ig", label: "IG" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "FB" },
  { key: "youtube", label: "YouTube" },
];

const COLUMNAS: ColumnaTabla<PonenteView>[] = [
  {
    label: "Nombre",
    get: (p) => <span className="font-medium">{p.nombre}</span>,
  },
  {
    label: "Cargo · Empresa",
    get: (p) => [p.cargo, p.empresa].filter(Boolean).join(" · ") || "—",
  },
  {
    label: "Formato",
    get: (p) => FMT_LABEL[p.formato_participacion] ?? p.formato_participacion,
  },
  { label: "Ciudad / País", get: (p) => p.ciudad_pais || "—" },
  { label: "Email", get: (p) => p.email || "—" },
];

// Contenido de la tarjeta (sin wrapper: TableroConVistas maneja drag/click).
function contenidoTarjeta(p: PonenteView) {
  const redes = REDES.filter((r) => p[r.key]);
  return (
    <>
      <div className="flex items-center gap-2">
        {p.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.foto_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft/40 text-xs font-semibold text-brand">
            {p.nombre.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-snug">
            {p.nombre}
          </p>
          {(p.cargo || p.empresa) && (
            <p className="truncate text-xs text-muted">
              {[p.cargo, p.empresa].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
        <span className="rounded-full border border-brand/40 bg-brand-soft/20 px-1.5 py-0.5 text-brand">
          {FMT_LABEL[p.formato_participacion] ?? p.formato_participacion}
        </span>
        {redes.map((r) => (
          <span
            key={r.key}
            className="rounded bg-surface-2 px-1.5 py-0.5 text-muted"
          >
            {r.label}
          </span>
        ))}
      </div>
    </>
  );
}

export function PonentesModulo({
  ponentes,
  puedeEditar,
  areaId,
  tareas,
  transversales,
}: {
  ponentes: PonenteView[];
  puedeEditar: boolean;
  areaId: string;
  tareas: TareaView[];
  transversales: TransversalView[];
}) {
  const [tab, setTab] = useState<"ponentes" | "tareas">("ponentes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ponentes</h1>
        <p className="text-sm text-muted">
          Pipeline de ponentes y tareas del área.
          {!puedeEditar && " Solo lectura."}
        </p>
      </div>

      <nav className="flex gap-1 border-b border-border">
        <Tab activo={tab === "ponentes"} onClick={() => setTab("ponentes")}>
          Ponentes ({ponentes.length})
        </Tab>
        <Tab activo={tab === "tareas"} onClick={() => setTab("tareas")}>
          Tareas del área
        </Tab>
      </nav>

      {tab === "ponentes" ? (
        <Pipeline ponentes={ponentes} puedeEditar={puedeEditar} />
      ) : (
        <KanbanInteractive
          areaId={areaId}
          areaSlug="ponentes"
          label="Tareas · Ponentes"
          tareas={tareas}
          puedeEditar={puedeEditar}
          transversales={transversales}
        />
      )}
    </div>
  );
}

function Tab({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-t-md px-4 py-2 text-sm transition-colors ${
        activo
          ? "border-b-2 border-brand font-medium text-brand"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Pipeline({
  ponentes,
  puedeEditar,
}: {
  ponentes: PonenteView[];
  puedeEditar: boolean;
}) {
  const [alta, setAlta] = useState(false);
  const [detalle, setDetalle] = useState<PonenteView | null>(null);
  const [fFormato, setFFormato] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [q, setQ] = useState("");

  // Filtro aplicado ANTES de pasar a TableroConVistas (memoizado para no
  // resetear la vista/optimismo en cada render).
  const visibles = useMemo(
    () =>
      ponentes.filter((p) => {
        if (fFormato && p.formato_participacion !== fFormato) return false;
        if (fEstado && p.estado !== fEstado) return false;
        if (q && !p.nombre.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [ponentes, fFormato, fEstado, q],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre…"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={fFormato}
          onChange={(e) => setFFormato(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="">Todos los formatos</option>
          {FORMATOS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          value={fEstado}
          onChange={(e) => setFEstado(e.target.value)}
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="">Todas las etapas</option>
          {ETAPAS_FULL.map((e) => (
            <option key={e.key} value={e.key}>
              {e.label}
            </option>
          ))}
        </select>
      </div>

      <TableroConVistas<PonenteView>
        items={visibles}
        getId={(p) => p.id}
        campoEtapa="estado"
        etapas={ETAPAS_FULL}
        columnas={COLUMNAS}
        renderCard={(p) => contenidoTarjeta(p)}
        onMover={(id, estado) => moverEtapaPonente(id, estado as EstadoPonente)}
        onAbrir={(p) => setDetalle(p)}
        puedeEditar={puedeEditar}
        acciones={
          puedeEditar ? (
            <button
              onClick={() => setAlta(true)}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-strong"
            >
              + Agregar ponente
            </button>
          ) : null
        }
      />

      {alta && (
        <PonenteModal
          titulo="Agregar ponente"
          inicial={null}
          onCerrar={() => setAlta(false)}
          onGuardado={() => setAlta(false)}
        />
      )}
      {detalle && (
        <PonenteModal
          titulo="Perfil del ponente"
          inicial={detalle}
          puedeEditar={puedeEditar}
          onCerrar={() => setDetalle(null)}
          onGuardado={() => setDetalle(null)}
        />
      )}
    </div>
  );
}

function PonenteModal({
  titulo,
  inicial,
  puedeEditar = true,
  onCerrar,
  onGuardado,
}: {
  titulo: string;
  inicial: PonenteView | null;
  puedeEditar?: boolean;
  onCerrar: () => void;
  onGuardado: (p?: PonenteView) => void;
}) {
  const [f, setF] = useState<PonenteView>(
    inicial ?? {
      id: "",
      nombre: "",
      email: "",
      telefono: "",
      cargo: "",
      empresa: "",
      ciudad_pais: "",
      foto_url: "",
      tema_propuesto: "",
      formato_participacion: "ponencia_general",
      experiencia_previa: "",
      bio: "",
      video_url: "",
      ig: "",
      tiktok: "",
      linkedin: "",
      facebook: "",
      youtube: "",
      notas_internas: "",
      estado: "prospecto",
      origen: "manual",
      creado_en: "",
    },
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const esNuevo = !inicial;

  function set<K extends keyof PonenteView>(k: K, v: PonenteView[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const datos: PonenteDatos = {
      nombre: f.nombre,
      email: f.email,
      telefono: f.telefono,
      cargo: f.cargo,
      empresa: f.empresa,
      ciudad_pais: f.ciudad_pais,
      foto_url: f.foto_url,
      tema_propuesto: f.tema_propuesto,
      formato_participacion: f.formato_participacion,
      experiencia_previa: f.experiencia_previa,
      bio: f.bio,
      video_url: f.video_url,
      ig: f.ig,
      tiktok: f.tiktok,
      linkedin: f.linkedin,
      facebook: f.facebook,
      youtube: f.youtube,
      notas_internas: f.notas_internas,
      estado: f.estado,
    };
    startTransition(async () => {
      const r = esNuevo
        ? await crearPonenteManual(datos)
        : await editarPonente(f.id, datos);
      if (r.ok) onGuardado(esNuevo ? undefined : f);
      else setError(r.mensaje ?? "No se pudo guardar.");
    });
  }

  const soloLectura = !puedeEditar;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      onClick={onCerrar}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={guardar}
        className="my-8 w-full max-w-2xl space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="text-lg font-semibold">{titulo}</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            label="Nombre *"
            v={f.nombre}
            on={(v) => set("nombre", v)}
            ro={soloLectura}
            req
          />
          <Campo
            label="Cargo"
            v={f.cargo}
            on={(v) => set("cargo", v)}
            ro={soloLectura}
          />
          <Campo
            label="Empresa"
            v={f.empresa}
            on={(v) => set("empresa", v)}
            ro={soloLectura}
          />
          <Campo
            label="Ciudad / País"
            v={f.ciudad_pais}
            on={(v) => set("ciudad_pais", v)}
            ro={soloLectura}
          />
          <Campo
            label="Email"
            v={f.email}
            on={(v) => set("email", v)}
            ro={soloLectura}
            type="email"
          />
          <Campo
            label="Teléfono"
            v={f.telefono}
            on={(v) => set("telefono", v)}
            ro={soloLectura}
          />
          <Campo
            label="Foto (URL)"
            v={f.foto_url}
            on={(v) => set("foto_url", v)}
            ro={soloLectura}
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Etapa</label>
            <select
              value={f.estado}
              disabled={soloLectura}
              onChange={(e) => set("estado", e.target.value as EstadoPonente)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
            >
              {ETAPAS_FULL.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            label="Tema propuesto *"
            v={f.tema_propuesto}
            on={(v) => set("tema_propuesto", v)}
            ro={soloLectura}
            req
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Formato</label>
            <select
              value={f.formato_participacion}
              disabled={soloLectura}
              onChange={(e) => set("formato_participacion", e.target.value)}
              className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
            >
              {FORMATOS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Area
          label="Bio"
          v={f.bio}
          on={(v) => set("bio", v)}
          ro={soloLectura}
        />
        <Area
          label="Experiencia previa"
          v={f.experiencia_previa}
          on={(v) => set("experiencia_previa", v)}
          ro={soloLectura}
        />
        <Campo
          label="Video de presentación (URL)"
          v={f.video_url}
          on={(v) => set("video_url", v)}
          ro={soloLectura}
        />

        <fieldset className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-3">
          <legend className="px-1 text-xs text-muted">Redes sociales</legend>
          <Campo
            label="Instagram"
            v={f.ig}
            on={(v) => set("ig", v)}
            ro={soloLectura}
          />
          <Campo
            label="TikTok"
            v={f.tiktok}
            on={(v) => set("tiktok", v)}
            ro={soloLectura}
          />
          <Campo
            label="LinkedIn"
            v={f.linkedin}
            on={(v) => set("linkedin", v)}
            ro={soloLectura}
          />
          <Campo
            label="Facebook"
            v={f.facebook}
            on={(v) => set("facebook", v)}
            ro={soloLectura}
          />
          <Campo
            label="YouTube"
            v={f.youtube}
            on={(v) => set("youtube", v)}
            ro={soloLectura}
          />
        </fieldset>

        <Area
          label="Notas internas"
          v={f.notas_internas}
          on={(v) => set("notas_internas", v)}
          ro={soloLectura}
        />

        {error && (
          <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cerrar
          </button>
          {!soloLectura && (
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
            >
              {pending
                ? "Guardando…"
                : esNuevo
                  ? "Crear ponente"
                  : "Guardar cambios"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  v,
  on,
  ro,
  req,
  type = "text",
}: {
  label: string;
  v: string | null;
  on: (v: string) => void;
  ro?: boolean;
  req?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type={type}
        required={req}
        disabled={ro}
        value={v ?? ""}
        onChange={(e) => on(e.target.value)}
        className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand disabled:opacity-60"
      />
    </div>
  );
}

function Area({
  label,
  v,
  on,
  ro,
}: {
  label: string;
  v: string | null;
  on: (v: string) => void;
  ro?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <textarea
        rows={3}
        disabled={ro}
        value={v ?? ""}
        onChange={(e) => on(e.target.value)}
        className="w-full resize-y rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand disabled:opacity-60"
      />
    </div>
  );
}
