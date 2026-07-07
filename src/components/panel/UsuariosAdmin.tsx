"use client";

import { useState, useTransition } from "react";
import {
  crearUsuario,
  cambiarRol,
  asignarArea,
  quitarArea,
} from "@/app/panel/admin/usuarios/actions";

type RolBase = "directivo" | "administrativo" | "gestor_area" | "colaborador";
type Nivel = "lectura" | "edicion" | "admin";

export interface AreaOption {
  id: string;
  slug: string;
  label: string;
  nivel: Nivel;
}

export interface UsuarioView {
  id: string;
  email: string;
  nombre: string;
  rol_base: RolBase;
  areas: { areaId: string; slug: string; label: string; nivel: Nivel }[];
}

const ROLES: RolBase[] = [
  "directivo",
  "administrativo",
  "gestor_area",
  "colaborador",
];
const NIVELES: Nivel[] = ["lectura", "edicion", "admin"];

export function UsuariosAdmin({
  usuarios,
  areaOptions,
}: {
  usuarios: UsuarioView[];
  areaOptions: AreaOption[];
}) {
  const [abrir, setAbrir] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted">
            Gestión del equipo, roles y acceso por área. Solo directivo /
            administrativo.
          </p>
        </div>
        <button
          onClick={() => setAbrir((v) => !v)}
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
        >
          {abrir ? "Cerrar" : "+ Nuevo usuario"}
        </button>
      </div>

      {abrir && <NuevoUsuarioForm onCreado={() => setAbrir(false)} />}

      <div className="space-y-3">
        {usuarios.map((u) => (
          <UsuarioRow key={u.id} usuario={u} areaOptions={areaOptions} />
        ))}
      </div>
    </div>
  );
}

function UsuarioRow({
  usuario,
  areaOptions,
}: {
  usuario: UsuarioView;
  areaOptions: AreaOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [areaSel, setAreaSel] = useState("");
  const [nivelSel, setNivelSel] = useState<Nivel>("edicion");

  const disponibles = areaOptions.filter(
    (a) => !usuario.areas.some((ua) => ua.areaId === a.id),
  );

  const esAdminGlobal =
    usuario.rol_base === "directivo" || usuario.rol_base === "administrativo";

  function agregar() {
    if (!areaSel) return;
    startTransition(async () => {
      await asignarArea(usuario.id, areaSel, nivelSel);
      setAreaSel("");
    });
  }

  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${pending ? "opacity-70" : ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{usuario.nombre}</p>
          <p className="text-xs text-muted">{usuario.email}</p>
        </div>
        <select
          value={usuario.rol_base}
          disabled={pending}
          onChange={(e) => {
            const rol = e.target.value as RolBase;
            startTransition(async () => {
              await cambiarRol(usuario.id, rol);
            });
          }}
          className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs capitalize outline-none focus:border-brand"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        {esAdminGlobal ? (
          <p className="text-xs text-muted">
            Rol global: ve y edita todas las áreas (no requiere asignación).
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {usuario.areas.length === 0 && (
                <span className="text-xs text-muted">Sin áreas asignadas.</span>
              )}
              {usuario.areas.map((a) => (
                <span
                  key={a.areaId}
                  className="inline-flex items-center gap-1 rounded-full border border-brand/40 bg-brand-soft/30 px-2 py-0.5 text-xs text-brand"
                >
                  {a.label} · {a.nivel}
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await quitarArea(usuario.id, a.areaId);
                      })
                    }
                    className="ml-0.5 text-muted hover:text-danger"
                    title="Quitar área"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {disponibles.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={areaSel}
                  onChange={(e) => setAreaSel(e.target.value)}
                  className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs outline-none focus:border-brand"
                >
                  <option value="">Agregar área…</option>
                  {disponibles.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
                <select
                  value={nivelSel}
                  onChange={(e) => setNivelSel(e.target.value as Nivel)}
                  className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs capitalize outline-none focus:border-brand"
                >
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregar}
                  disabled={!areaSel || pending}
                  className="rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-strong disabled:opacity-50"
                >
                  Asignar
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NuevoUsuarioForm({ onCreado }: { onCreado: () => void }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolBase>("gestor_area");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function crear(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await crearUsuario({ email, nombre, password, rol_base: rol });
      if (r.ok) {
        setEmail("");
        setNombre("");
        setPassword("");
        setRol("gestor_area");
        onCreado();
      } else {
        setError(r.mensaje ?? "No se pudo crear.");
      }
    });
  }

  return (
    <form
      onSubmit={crear}
      className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="correo@feriaeffix.com"
        type="email"
        required
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña inicial"
        type="text"
        required
        minLength={6}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as RolBase)}
        className="rounded-md border border-border bg-surface-2 px-3 py-2 text-sm capitalize outline-none focus:border-brand"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && (
        <p className="rounded-md border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn sm:col-span-2">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong disabled:opacity-60 sm:col-span-2"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
    </form>
  );
}
