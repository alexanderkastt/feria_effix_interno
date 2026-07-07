"use client";

import { useState, useTransition } from "react";
import {
  crearContacto,
  moverEtapa,
  type EtapaPipeline,
  type TipoPipeline,
} from "@/app/panel/pipeline-actions";
import {
  TableroConVistas,
  type ColumnaTabla,
} from "@/components/panel/TableroConVistas";

export interface ContactoView {
  id: string;
  nombre_entidad: string;
  tipo_entidad: string | null;
  pais: string | null;
  etapa: EtapaPipeline;
  codigo_descuento: string | null;
  fecha_corte_codigo: string | null;
  responsable: string | null;
}

const ETAPAS: { key: EtapaPipeline; label: string }[] = [
  { key: "contactado", label: "Contactado" },
  { key: "propuesta_enviada", label: "Propuesta enviada" },
  { key: "negociacion", label: "Negociación" },
  { key: "cerrado", label: "Cerrado" },
  { key: "descartado", label: "Descartado" },
];

function diasPara(fecha: string | null): number | null {
  if (!fecha) return null;
  const ms = new Date(fecha).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function CodigoDescuento({ c }: { c: ContactoView }) {
  if (!c.codigo_descuento) return <span className="text-muted">—</span>;
  const dias = diasPara(c.fecha_corte_codigo);
  const porVencer = dias !== null && dias <= 30;
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
        {c.codigo_descuento}
      </span>
      {porVencer && (
        <span className="rounded-full border border-danger/50 bg-danger/10 px-2 py-0.5 text-danger">
          {dias! <= 0 ? "vencido" : `vence en ${dias}d`}
        </span>
      )}
    </span>
  );
}

export function PipelineCRM({
  tipo,
  titulo,
  contactos,
  puedeEditar,
}: {
  tipo: TipoPipeline;
  titulo: string;
  contactos: ContactoView[];
  puedeEditar: boolean;
}) {
  const [abrir, setAbrir] = useState(false);

  const columnas: ColumnaTabla<ContactoView>[] = [
    { label: "Entidad", get: (c) => c.nombre_entidad },
    { label: "Tipo de entidad", get: (c) => c.tipo_entidad ?? "—" },
    { label: "País", get: (c) => c.pais ?? "—" },
    { label: "Responsable", get: (c) => c.responsable ?? "—" },
    { label: "Código descuento", get: (c) => <CodigoDescuento c={c} /> },
  ];

  const renderCard = (c: ContactoView) => (
    <>
      <p className="text-sm font-medium leading-snug">{c.nombre_entidad}</p>
      {c.tipo_entidad && (
        <p className="mt-0.5 text-xs text-muted">{c.tipo_entidad}</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
        {c.pais && <span>{c.pais}</span>}
        {c.responsable && <span className="ml-auto">{c.responsable}</span>}
      </div>
      {c.codigo_descuento && (
        <div className="mt-2">
          <CodigoDescuento c={c} />
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted">
          Pipeline tipo CRM.{!puedeEditar && " Solo lectura."}
        </p>
      </div>

      {abrir && puedeEditar && (
        <NuevoContactoForm tipo={tipo} onCreado={() => setAbrir(false)} />
      )}

      <TableroConVistas<ContactoView>
        items={contactos}
        getId={(c) => c.id}
        campoEtapa="etapa"
        etapas={ETAPAS}
        columnas={columnas}
        renderCard={renderCard}
        onMover={(id, etapa) => moverEtapa(id, etapa as EtapaPipeline, tipo)}
        puedeEditar={puedeEditar}
        acciones={
          puedeEditar ? (
            <button
              onClick={() => setAbrir((v) => !v)}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              {abrir ? "Cerrar" : "+ Nuevo contacto"}
            </button>
          ) : null
        }
      />
    </div>
  );
}

function NuevoContactoForm({
  tipo,
  onCreado,
}: {
  tipo: TipoPipeline;
  onCreado: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [tipoEntidad, setTipoEntidad] = useState("");
  const [pais, setPais] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    if (nombre.trim().length < 2) return;
    setError("");
    startTransition(async () => {
      const r = await crearContacto({
        tipo,
        nombre_entidad: nombre,
        tipo_entidad: tipoEntidad,
        pais,
        codigo_descuento: codigo,
      });
      if (r.ok) {
        setNombre("");
        setTipoEntidad("");
        setPais("");
        setCodigo("");
        onCreado();
      } else {
        setError(r.mensaje ?? "No se pudo crear.");
      }
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la entidad"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={tipoEntidad}
        onChange={(e) => setTipoEntidad(e.target.value)}
        placeholder="Tipo (Universidad, Gobierno…)"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={pais}
        onChange={(e) => setPais(e.target.value)}
        placeholder="País"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        placeholder="Código descuento (opc.)"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      {error && (
        <p className="text-sm text-warn sm:col-span-2 lg:col-span-4">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2 lg:col-span-4"
      >
        {pending ? "Guardando…" : "Crear contacto"}
      </button>
    </form>
  );
}
