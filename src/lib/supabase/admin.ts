import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service_role. SOLO servidor (nunca importar en componentes cliente).
// Se usa para operaciones públicas controladas (reserva de stand) que validamos
// del lado del servidor, evitando dar permisos de escritura al rol anónimo.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
