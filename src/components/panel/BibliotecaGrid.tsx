"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AREAS, AREA_LABEL, type AreaSlug } from "@/lib/areas";
import { eliminarArchivo } from "@/app/panel/biblioteca/actions";

export interface ArchivoView {
  id: string;
  nombre: string;
  tipo: string;
  area: AreaSlug | null;
  drive_url: string | null;
  miniatura_url: string | null;
  tags: string[];
  mime_type: string | null;
}

const TIPOS = [
  "logo",
  "video",
  "documento",
  "contrato",
  "plano",
  "foto",
  "otro",
] as const;

const ICONO: Record<string, string> = {
  logo: "◆",
  video: "▶",
  documento: "▤",
  contrato: "✎",
  plano: "▦",
  foto: "❏",
  otro: "•",
};

const COLORES = [
  { nombre: "Negro", hex: "#0D0D0D" },
  { nombre: "Azul eléctrico", hex: "#1A6FFF" },
];

export function BibliotecaGrid({
  archivos,
  driveOk,
}: {
  archivos: ArchivoView[];
  driveOk: boolean;
}) {
  const [tipo, setTipo] = useState("");
  const [area, setArea] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<ArchivoView | null>(null);

  const logos = archivos.filter((a) => a.tipo === "logo");

  const term = q.trim().toLowerCase();
  const filtrados = archivos.filter((a) => {
    if (tipo && a.tipo !== tipo) return false;
    if (area && a.area !== area) return false;
    if (term) {
      const enNombre = a.nombre.toLowerCase().includes(term);
      const enTags = a.tags.some((t) => t.toLowerCase().includes(term));
      if (!enNombre && !enTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Biblioteca</h1>
        <p className="text-sm text-muted">
          Logos, videos, documentos y planos de Feria Effix, en un solo lugar.
        </p>
      </div>

      {/* Brand Kit */}
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-sm font-semibold text-muted">
          Brand Kit oficial
        </h2>
        <div className="flex flex-wrap gap-3">
          {COLORES.map((c) => (
            <Swatch key={c.hex} nombre={c.nombre} hex={c.hex} />
          ))}
          {logos.map((l) => (
            <button
              key={l.id}
              onClick={() => setSel(l)}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:border-brand/50"
            >
              <span className="text-brand">◆</span>
              {l.nombre}
            </button>
          ))}
        </div>
      </section>

      <UploadZone driveOk={driveOk} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o tag…"
          className="min-w-48 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm capitalize outline-none focus:border-brand"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Todas las áreas</option>
          {AREAS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtrados.map((a) => (
          <button
            key={a.id}
            onClick={() => setSel(a)}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-brand/50"
          >
            <div className="grid aspect-video place-items-center bg-surface-2">
              {a.miniatura_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.miniatura_url}
                  alt={a.nombre}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl text-muted">
                  {ICONO[a.tipo] ?? "•"}
                </span>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="line-clamp-2 text-sm font-medium">{a.nombre}</p>
              <p className="text-xs capitalize text-muted">
                {a.tipo}
                {a.area && ` · ${AREA_LABEL[a.area]}`}
              </p>
            </div>
          </button>
        ))}
        {filtrados.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted">
            No hay archivos con esos filtros.
          </p>
        )}
      </div>

      {sel && <DetalleModal archivo={sel} onClose={() => setSel(null)} />}
    </div>
  );
}

function Swatch({ nombre, hex }: { nombre: string; hex: string }) {
  const [copiado, setCopiado] = useState(false);
  function copiar() {
    navigator.clipboard?.writeText(hex);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1200);
  }
  return (
    <button
      onClick={copiar}
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm hover:border-brand/50"
      title="Copiar hex"
    >
      <span
        className="h-6 w-6 rounded border border-border"
        style={{ backgroundColor: hex }}
      />
      <span>
        {nombre}
        <span className="ml-2 font-mono text-xs text-muted">
          {copiado ? "¡copiado!" : hex}
        </span>
      </span>
    </button>
  );
}

function UploadZone({ driveOk }: { driveOk: boolean }) {
  const router = useRouter();
  const [tipo, setTipo] = useState("otro");
  const [areaSlug, setAreaSlug] = useState("");
  const [tags, setTags] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, startTransition] = useTransition();

  function subir(file: File) {
    if (!driveOk) {
      setMsg("Google Drive no está configurado todavía.");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tipo", tipo);
    if (areaSlug) fd.append("area_slug", areaSlug);
    fd.append("tags", tags);
    setMsg("");
    startTransition(async () => {
      const res = await fetch("/api/biblioteca/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setMsg("Archivo subido.");
        router.refresh();
      } else {
        setMsg(data.mensaje ?? "No se pudo subir.");
      }
    });
  }

  return (
    <section className="rounded-xl border border-dashed border-border bg-surface p-5">
      <div className="flex flex-wrap items-end gap-3">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={areaSlug}
          onChange={(e) => setAreaSlug(e.target.value)}
          className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Sin área</option>
          {AREAS.map((a) => (
            <option key={a.slug} value={a.slug}>
              {a.label}
            </option>
          ))}
        </select>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags separadas por coma"
          className="min-w-40 flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
        />
        <label
          className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white ${driveOk ? "bg-brand hover:bg-brand-strong" : "bg-surface-2 text-muted"}`}
        >
          {pending ? "Subiendo…" : "Subir archivo"}
          <input
            type="file"
            className="hidden"
            disabled={!driveOk || pending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) subir(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {!driveOk && (
        <p className="mt-3 text-xs text-warn">
          La subida a Google Drive se activa cuando se configure la Service
          Account (GOOGLE_SERVICE_ACCOUNT_JSON y DRIVE_FOLDER_ID).
        </p>
      )}
      {msg && <p className="mt-3 text-sm text-muted">{msg}</p>}
    </section>
  );
}

function DetalleModal({
  archivo,
  onClose,
}: {
  archivo: ArchivoView;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const esImagen = archivo.mime_type?.startsWith("image/");
  const esVideo = archivo.mime_type?.startsWith("video/");

  function borrar() {
    startTransition(async () => {
      await eliminarArchivo(archivo.id);
      router.refresh();
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">{archivo.nombre}</h2>
        <p className="mt-1 text-xs capitalize text-muted">{archivo.tipo}</p>

        <div className="mt-4 grid aspect-video place-items-center overflow-hidden rounded-lg bg-surface-2">
          {esImagen && archivo.miniatura_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={archivo.miniatura_url}
              alt={archivo.nombre}
              className="h-full w-full object-contain"
            />
          ) : esVideo && archivo.drive_url ? (
            <span className="text-sm text-muted">Video en Drive</span>
          ) : (
            <span className="text-4xl text-muted">
              {ICONO[archivo.tipo] ?? "•"}
            </span>
          )}
        </div>

        {archivo.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {archivo.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {archivo.drive_url ? (
            <a
              href={archivo.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
            >
              Abrir en Drive
            </a>
          ) : (
            <span className="rounded-md border border-border px-4 py-2 text-sm text-muted">
              Archivo no disponible
            </span>
          )}
          <button
            onClick={borrar}
            disabled={pending}
            className="rounded-md border border-danger/40 px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-60"
          >
            {pending ? "Eliminando…" : "Eliminar"}
          </button>
          <button
            onClick={onClose}
            className="ml-auto rounded-md border border-border px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
