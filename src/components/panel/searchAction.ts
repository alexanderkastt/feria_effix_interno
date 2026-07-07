"use server";

import { createClient } from "@/lib/supabase/server";

export interface ResultadoBusqueda {
  tipo: string;
  id: string;
  titulo: string;
  subtitulo: string | null;
  ruta: string;
}

// Búsqueda global. Llama a la función buscar_global (SECURITY INVOKER),
// que respeta la RLS del usuario: no devuelve lo que el rol no puede ver.
export async function buscarGlobal(q: string): Promise<ResultadoBusqueda[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("buscar_global", { q: term });
  if (error) return [];
  return (data ?? []) as ResultadoBusqueda[];
}
