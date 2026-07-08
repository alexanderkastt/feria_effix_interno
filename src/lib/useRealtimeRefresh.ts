"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Se suscribe a cambios (insert/update/delete) en las tablas dadas y refresca
// los datos del servidor cuando algo cambia, sin recargar la página ni perder
// el estado local del componente (filtros, modales abiertos, etc.) — así el
// panel queda "en vivo": si otra persona edita algo, se ve reflejado solo.
//
// `tablas` debe ser una referencia estable (definila fuera del componente o
// con useMemo) para no re-suscribirse en cada render.
export function useRealtimeRefresh(tablas: readonly string[]) {
  const router = useRouter();
  const clave = tablas.join(",");

  useEffect(() => {
    const supabase = createClient();
    let timeout: ReturnType<typeof setTimeout> | null = null;

    // Debounce: si llegan varios cambios seguidos (ej. un import o una
    // fusión que toca varias filas), refresca una sola vez.
    function programarRefresh() {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => router.refresh(), 400);
    }

    const canal = supabase.channel(`realtime:${clave}`);
    for (const tabla of tablas) {
      canal.on(
        "postgres_changes",
        { event: "*", schema: "public", table: tabla },
        programarRefresh,
      );
    }
    canal.subscribe();

    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(canal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, router]);
}
