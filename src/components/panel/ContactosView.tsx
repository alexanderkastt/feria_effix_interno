"use client";

import { useMemo, useState, useTransition, useRef } from "react";
import Papa from "papaparse";
import {
  crearContacto,
  editarContacto,
  marcarConsentimiento,
  importarContactosCsv,
  crearAudienciaDesdeFiltro,
} from "@/app/panel/comunicaciones/contactos/actions";

export interface Contacto {
  id: string;
  nombre: string | null;
  email: string | null;
  telefono_whatsapp: string | null;
  tipo_contacto: string;
  consentimiento_marketing: boolean;
  origen_consentimiento: string | null;
  pais: string | null;
  tags: string[];
  ultima_interaccion: string;
}

const TIPOS = [
  "comprador_boleta",
  "postulante_ponente",
  "cliente_stand",
  "patrocinador",
  "aliado",
  "comunidad",
  "embajador",
  "otro",
] as const;

const TIPO_LABEL: Record<string, string> = {
  comprador_boleta: "Comprador boleta",
  postulante_ponente: "Postulante ponente",
  cliente_stand: "Cliente stand",
  patrocinador: "Patrocinador",
  aliado: "Aliado",
  comunidad: "Comunidad",
  embajador: "Embajador",
  otro: "Otro",
};

export function ContactosView({ contactos }: { contactos: Contacto[] }) {
  const [fTipo, setFTipo] = useState("");
  const [fPais, setFPais] = useState("");
  const [fTag, setFTag] = useState("");
  const [fConsent, setFConsent] = useState<"" | "con" | "sin">("");
  const [form, setForm] = useState<null | Contacto>(null);
  const [nuevoAbierto, setNuevoAbierto] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [audAbierta, setAudAbierta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const filtrados = useMemo(
    () =>
      contactos.filter((c) => {
        if (fTipo && c.tipo_contacto !== fTipo) return false;
        if (
          fPais &&
          !(c.pais ?? "").toLowerCase().includes(fPais.toLowerCase())
        )
          return false;
        if (
          fTag &&
          !c.tags.some((t) => t.toLowerCase().includes(fTag.toLowerCase()))
        )
          return false;
        if (fConsent === "con" && !c.consentimiento_marketing) return false;
        if (fConsent === "sin" && c.consentimiento_marketing) return false;
        return true;
      }),
    [contactos, fTipo, fPais, fTag, fConsent],
  );

  function onCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        startTransition(async () => {
          const r = await importarContactosCsv(res.data);
          setAviso(r.mensaje ?? null);
          if (fileRef.current) fileRef.current.value = "";
        });
      },
    });
  }

  return (
    <div className="space-y-5">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setForm(null);
            setNuevoAbierto((v) => !v);
          }}
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-strong"
        >
          + Nuevo contacto
        </button>
        <label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-brand/50 hover:text-foreground">
          Importar CSV
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={onCsv}
            className="hidden"
          />
        </label>
        <button
          onClick={() => setAudAbierta(true)}
          disabled={filtrados.length === 0}
          className="rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-brand/50 hover:text-foreground disabled:opacity-40"
        >
          Crear audiencia del filtro ({filtrados.length})
        </button>
        <span className="ml-auto text-xs text-muted">
          {filtrados.length} de {contactos.length} contactos
        </span>
      </div>

      {aviso && (
        <p className="rounded-md border border-brand/30 bg-brand-soft/10 px-3 py-2 text-sm">
          {aviso}
        </p>
      )}

      {/* Filtros */}
      <div className="grid gap-2 sm:grid-cols-4">
        <select
          value={fTipo}
          onChange={(e) => setFTipo(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {TIPO_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          value={fPais}
          onChange={(e) => setFPais(e.target.value)}
          placeholder="País"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <input
          value={fTag}
          onChange={(e) => setFTag(e.target.value)}
          placeholder="Tag"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={fConsent}
          onChange={(e) => setFConsent(e.target.value as "" | "con" | "sin")}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Consentimiento: todos</option>
          <option value="con">Con consentimiento</option>
          <option value="sin">Sin consentimiento</option>
        </select>
      </div>

      {(nuevoAbierto || form) && (
        <ContactoForm
          contacto={form}
          onClose={() => {
            setNuevoAbierto(false);
            setForm(null);
          }}
        />
      )}

      {/* Tabla */}
      <div
        className={`overflow-x-auto rounded-xl border border-border bg-surface ${pending ? "opacity-70" : ""}`}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="p-3 font-medium">Nombre</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Tipo</th>
              <th className="p-3 font-medium">País</th>
              <th className="p-3 font-medium">Consentimiento</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted">
                  Sin contactos que coincidan.
                </td>
              </tr>
            )}
            {filtrados.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="p-3 font-medium">{c.nombre ?? "—"}</td>
                <td className="p-3 text-muted">{c.email ?? "—"}</td>
                <td className="p-3 text-muted">
                  {TIPO_LABEL[c.tipo_contacto]}
                </td>
                <td className="p-3 text-muted">{c.pais ?? "—"}</td>
                <td className="p-3">
                  {c.consentimiento_marketing ? (
                    <span className="rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 text-xs text-ok">
                      Consiente
                    </span>
                  ) : (
                    <span className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      Sin consentimiento
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    {!c.consentimiento_marketing && (
                      <button
                        onClick={() => setConsentId(c.id)}
                        className="text-xs text-brand hover:underline"
                      >
                        Marcar consentimiento
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setNuevoAbierto(false);
                        setForm(c);
                      }}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {consentId && (
        <ConsentModal
          onClose={() => setConsentId(null)}
          onConfirm={(origen) =>
            startTransition(async () => {
              await marcarConsentimiento(consentId, origen);
              setConsentId(null);
            })
          }
        />
      )}

      {audAbierta && (
        <AudienciaModal
          total={filtrados.length}
          onClose={() => setAudAbierta(false)}
          onConfirm={(nombre) =>
            startTransition(async () => {
              const r = await crearAudienciaDesdeFiltro(
                nombre,
                filtrados.map((c) => c.id),
              );
              setAviso(r.mensaje ?? null);
              setAudAbierta(false);
            })
          }
        />
      )}
    </div>
  );
}

function ContactoForm({
  contacto,
  onClose,
}: {
  contacto: Contacto | null;
  onClose: () => void;
}) {
  const editar = !!contacto;
  const [nombre, setNombre] = useState(contacto?.nombre ?? "");
  const [email, setEmail] = useState(contacto?.email ?? "");
  const [tel, setTel] = useState(contacto?.telefono_whatsapp ?? "");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>(
    (contacto?.tipo_contacto as (typeof TIPOS)[number]) ?? "otro",
  );
  const [pais, setPais] = useState(contacto?.pais ?? "");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = editar
        ? await editarContacto(contacto!.id, {
            nombre,
            telefono_whatsapp: tel,
            tipo_contacto: tipo,
            pais,
          })
        : await crearContacto({
            nombre,
            email,
            telefono_whatsapp: tel,
            tipo_contacto: tipo,
            pais,
          });
      if (r.ok) onClose();
      else setMsg(r.mensaje ?? "Error");
    });
  }

  return (
    <form
      onSubmit={guardar}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        type="email"
        disabled={editar}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-50"
      />
      <input
        value={tel}
        onChange={(e) => setTel(e.target.value)}
        placeholder="WhatsApp"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <input
        value={pais}
        onChange={(e) => setPais(e.target.value)}
        placeholder="País"
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value as (typeof TIPOS)[number])}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      >
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {TIPO_LABEL[t]}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {editar ? "Guardar" : "Crear"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
        >
          Cancelar
        </button>
        {msg && <span className="text-xs text-warn">{msg}</span>}
      </div>
    </form>
  );
}

function ConsentModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (origen: string) => void;
}) {
  const [origen, setOrigen] = useState("");
  return (
    <Modal onClose={onClose} titulo="Registrar consentimiento">
      <p className="text-sm text-muted">
        Ley 1581: registrá el origen del consentimiento de marketing.
      </p>
      <input
        value={origen}
        onChange={(e) => setOrigen(e.target.value)}
        placeholder="Ej. compra de boleta, formulario, evento…"
        className="mt-3 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <button
        onClick={() => onConfirm(origen)}
        disabled={origen.trim().length < 3}
        className="mt-4 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
      >
        Confirmar consentimiento
      </button>
    </Modal>
  );
}

function AudienciaModal({
  total,
  onClose,
  onConfirm,
}: {
  total: number;
  onClose: () => void;
  onConfirm: (nombre: string) => void;
}) {
  const [nombre, setNombre] = useState("");
  return (
    <Modal onClose={onClose} titulo="Nueva audiencia manual">
      <p className="text-sm text-muted">
        Se creará con los {total} contactos del filtro actual.
      </p>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la audiencia"
        className="mt-3 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <button
        onClick={() => onConfirm(nombre)}
        disabled={nombre.trim().length < 2}
        className="mt-4 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-50"
      >
        Crear audiencia
      </button>
    </Modal>
  );
}

function Modal({
  titulo,
  onClose,
  children,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold">{titulo}</h3>
        {children}
      </div>
    </div>
  );
}
