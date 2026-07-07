import { createClient } from "@/lib/supabase/server";
import { ContactosView, type Contacto } from "@/components/panel/ContactosView";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contactos")
    .select(
      "id, nombre, email, telefono_whatsapp, tipo_contacto, consentimiento_marketing, origen_consentimiento, pais, tags, ultima_interaccion",
    )
    .order("ultima_interaccion", { ascending: false });

  return <ContactosView contactos={(data ?? []) as Contacto[]} />;
}
