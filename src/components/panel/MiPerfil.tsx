"use client";

import { useState, useTransition } from "react";
import { actualizarMiPerfil } from "@/app/panel/perfil/actions";

export interface MiPerfilData {
  id: string;
  email: string;
  nombre: string;
  rol_base:
    | "directivo"
    | "administrativo"
    | "gestor_area"
    | "colaborador"
    | "finanzas_operativo";
  telefono: string | null;
  cargo: string | null;
  avatar_url: string | null;
  notif_por_email: boolean;
}

const ROL_LABEL: Record<MiPerfilData["rol_base"], string> = {
  directivo: "Directivo",
  administrativo: "Administrativo",
  gestor_area: "Gestor de área",
  colaborador: "Colaborador",
  finanzas_operativo: "Finanzas (operativo)",
};

export function MiPerfil({ perfil }: { perfil: MiPerfilData }) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [telefono, setTelefono] = useState(perfil.telefono ?? "");
  const [cargo, setCargo] = useState(perfil.cargo ?? "");
  const [notifPorEmail, setNotifPorEmail] = useState(perfil.notif_por_email);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<{
    tipo: "ok" | "error";
    texto: string;
  } | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    startTransition(async () => {
      const r = await actualizarMiPerfil({
        nombre,
        telefono: telefono || null,
        cargo: cargo || null,
        notif_por_email: notifPorEmail,
      });
      setMensaje(
        r.ok
          ? { tipo: "ok", texto: "Datos guardados." }
          : { tipo: "error", texto: r.mensaje ?? "No se pudo guardar." },
      );
    });
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-sm text-muted">
          Tus datos. El correo y el rol los administra el equipo de gestión.
        </p>
      </div>

      <form
        onSubmit={guardar}
        className="space-y-4 rounded-xl border border-border bg-surface p-6"
      >
        <div className="flex flex-wrap items-center gap-3 border-b border-border/60 pb-4">
          <div>
            <p className="text-sm text-muted">Correo</p>
            <p className="font-medium">{perfil.email}</p>
          </div>
          <span className="ml-auto rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-xs text-brand">
            {ROL_LABEL[perfil.rol_base]}
          </span>
        </div>

        <Campo label="Nombre *">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <Campo label="Cargo / puesto">
          <input
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ej. Coordinador comercial"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <Campo label="Teléfono">
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            type="tel"
            placeholder="Ej. 300 1234567"
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifPorEmail}
            onChange={(e) => setNotifPorEmail(e.target.checked)}
            className="h-4 w-4 accent-brand"
          />
          Recibir notificaciones también por correo
        </label>

        {mensaje && (
          <p
            className={`text-sm ${mensaje.tipo === "ok" ? "text-ok" : "text-danger"}`}
          >
            {mensaje.texto}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}
