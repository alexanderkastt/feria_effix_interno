"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  type Notif,
} from "@/app/panel/notificaciones/actions";

const TIPO_COLOR: Record<Notif["tipo"], string> = {
  tarea_asignada: "bg-brand",
  tarea_vencida: "bg-danger",
  aprobacion_pendiente: "bg-warn",
  pago_recibido: "bg-ok",
  postulacion_nueva: "bg-brand",
  mencion: "bg-muted",
};

function tiempoRel(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

export function NotificacionesBell() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [, startTransition] = useTransition();

  async function cargar() {
    const r = await getNotificaciones(8);
    setItems(r.items);
    setNoLeidas(r.noLeidas);
  }

  useEffect(() => {
    let activo = true;
    getNotificaciones(8).then((r) => {
      if (!activo) return;
      setItems(r.items);
      setNoLeidas(r.noLeidas);
    });
    return () => {
      activo = false;
    };
  }, []);

  function abrir(n: Notif) {
    startTransition(async () => {
      if (!n.leida) await marcarLeida(n.id);
      setAbierto(false);
      await cargar();
      if (n.url_relacionada) router.push(n.url_relacionada);
    });
  }

  function todasLeidas() {
    startTransition(async () => {
      await marcarTodasLeidas();
      await cargar();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-muted transition-colors hover:text-foreground"
        aria-label="Notificaciones"
      >
        <span aria-hidden>🔔</span>
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold">Notificaciones</span>
              {noLeidas > 0 && (
                <button
                  onClick={todasLeidas}
                  className="text-xs text-brand hover:underline"
                >
                  Marcar todas
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted">
                  Sin notificaciones.
                </p>
              )}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => abrir(n)}
                  className={`flex w-full gap-2 border-b border-border/60 px-3 py-2 text-left transition-colors hover:bg-surface-2 ${
                    n.leida ? "opacity-60" : ""
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TIPO_COLOR[n.tipo]}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium leading-snug">
                      {n.titulo}
                    </span>
                    {n.mensaje && (
                      <span className="block truncate text-xs text-muted">
                        {n.mensaje}
                      </span>
                    )}
                    <span className="text-[10px] text-muted">
                      {tiempoRel(n.creado_en)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <Link
              href="/panel/notificaciones"
              onClick={() => setAbierto(false)}
              className="block border-t border-border px-3 py-2 text-center text-xs text-brand hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
