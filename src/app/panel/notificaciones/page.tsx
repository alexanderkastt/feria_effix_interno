"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getTodas,
  marcarLeida,
  marcarTodasLeidas,
  setNotifPorEmail,
  type Notif,
} from "./actions";

const TIPO_LABEL: Record<Notif["tipo"], string> = {
  tarea_asignada: "Tarea asignada",
  tarea_vencida: "Tarea vencida",
  aprobacion_pendiente: "Aprobación pendiente",
  pago_recibido: "Pago recibido",
  postulacion_nueva: "Postulación nueva",
  mencion: "Mención",
};

const TIPO_COLOR: Record<Notif["tipo"], string> = {
  tarea_asignada: "border-brand/40 bg-brand-soft/30 text-brand",
  tarea_vencida: "border-danger/50 bg-danger/10 text-danger",
  aprobacion_pendiente: "border-warn/50 bg-warn/10 text-warn",
  pago_recibido: "border-ok/50 bg-ok/10 text-ok",
  postulacion_nueva: "border-brand/40 bg-brand-soft/30 text-brand",
  mencion: "border-border bg-surface-2 text-muted",
};

export default function NotificacionesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [notifPorEmail, setPref] = useState(false);
  const [soloNoLeidas, setSoloNoLeidas] = useState(false);
  const [, startTransition] = useTransition();

  async function cargar(filtro: boolean) {
    const r = await getTodas(filtro);
    setItems(r.items);
    setPref(r.notifPorEmail);
  }

  useEffect(() => {
    let activo = true;
    getTodas(soloNoLeidas).then((r) => {
      if (!activo) return;
      setItems(r.items);
      setPref(r.notifPorEmail);
    });
    return () => {
      activo = false;
    };
  }, [soloNoLeidas]);

  function abrir(n: Notif) {
    startTransition(async () => {
      if (!n.leida) await marcarLeida(n.id);
      if (n.url_relacionada) router.push(n.url_relacionada);
      else await cargar(soloNoLeidas);
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-sm text-muted">
            Todo lo que pasa y necesitás saber.
          </p>
        </div>
        <button
          onClick={() =>
            startTransition(async () => {
              await marcarTodasLeidas();
              await cargar(soloNoLeidas);
            })
          }
          className="rounded-md border border-border px-3 py-2 text-xs text-muted hover:text-foreground"
        >
          Marcar todas como leídas
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloNoLeidas}
            onChange={(e) => setSoloNoLeidas(e.target.checked)}
          />
          Solo no leídas
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifPorEmail}
            onChange={(e) => {
              const v = e.target.checked;
              setPref(v);
              startTransition(() => setNotifPorEmail(v).then(() => {}));
            }}
          />
          Recibir también por email
        </label>
      </div>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-muted">
            No hay notificaciones.
          </p>
        )}
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => abrir(n)}
            className={`flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-brand/50 ${
              n.leida ? "opacity-60" : ""
            }`}
          >
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${TIPO_COLOR[n.tipo]}`}
            >
              {TIPO_LABEL[n.tipo]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{n.titulo}</span>
              {n.mensaje && (
                <span className="block text-xs text-muted">{n.mensaje}</span>
              )}
            </span>
            {!n.leida && (
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
