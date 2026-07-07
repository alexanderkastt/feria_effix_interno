import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase para componentes del lado del browser.
// Usa únicamente la clave publicable (nunca la service_role).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
