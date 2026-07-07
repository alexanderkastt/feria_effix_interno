# Bloque 2 — Datos estructurados Schema.org Event (handoff)

> Sitio: feriaeffix.com (WordPress + Elementor). El dueño NO tiene acceso admin:
> esto es código listo para pegar por quien tenga acceso.
> **Hoy el sitio NO tiene ningún JSON-LD de evento** (confirmado en el `<head>` del home).

## 1. Qué falta completar antes de publicar
- `URL_OG_IMAGE_A_COMPLETAR` → la URL absoluta de la imagen de portada del evento
  (idealmente 1200×630). Se saca del `og:image` del sitio o subiendo una a Medios de WP.
- `PRECIO_GENERAL_COP` → precio de la Entrada General / Pasaporte 3 días (hoy está en imagen).
- `PRECIO_AFICIONADO_COP` / etapas → si se quiere ofertar por etapa.
- Confirmar fecha de fin de vigencia de cada oferta (`validThrough`).

**Precios ya confirmados leídos del sitio:**
- Entrada VIP: **$1.155.000 COP** (IVA incluido) — compra en La Tiquetera.
- Boleta Black: **$997 USD** (valor real $1.323 USD; 4 cuotas de $250 USD) — compra Wompi/ePayco.
- Entrada General / Pasaporte 3 días: precio en imagen, no legible → completar.

## 2. JSON-LD para el HOME y /entradas/ (mismo bloque sirve para ambas)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Feria Effix 2026",
  "description": "Sexta edición de la feria de e-commerce Effix: ponentes, stands, marcas y networking en Medellín.",
  "startDate": "2026-10-15T09:00:00-05:00",
  "endDate": "2026-10-19T20:00:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "image": [ "URL_OG_IMAGE_A_COMPLETAR" ],
  "location": {
    "@type": "Place",
    "name": "Plaza Mayor Medellín",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Calle 41 # 55-80",
      "addressLocality": "Medellín",
      "addressRegion": "Antioquia",
      "postalCode": "050015",
      "addressCountry": "CO"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "EFFIX S.A.S",
    "url": "https://feriaeffix.com/"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Entrada General (Pasaporte 3 días)",
      "url": "https://latiquetera.com/site/effix/events/view/feria-comercio-electronico-effix2026",
      "price": "PRECIO_GENERAL_COP",
      "priceCurrency": "COP",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-01-01T00:00:00-05:00"
    },
    {
      "@type": "Offer",
      "name": "Entrada VIP",
      "url": "https://latiquetera.com/site/effix/events/view/feria-comercio-electronico-effix2026",
      "price": "1155000",
      "priceCurrency": "COP",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-01-01T00:00:00-05:00"
    },
    {
      "@type": "Offer",
      "name": "Boleta Black",
      "url": "https://checkout.wompi.co/l/xlLrYC",
      "price": "997",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "validFrom": "2026-01-01T00:00:00-05:00"
    }
  ]
}
</script>
```

### Nota sobre las fechas diferenciadas (VIP/Black 15–19 · General 16–18)
Google exige UN `startDate`/`endDate` por Event. El bloque de arriba usa el **rango completo
15–19 oct** (el que abarca todo). Si querés reflejar explícitamente que la General es 16–18,
se puede modelar con `subEvent` (opcional, no obligatorio para el rich result):

```json
"subEvent": [
  { "@type": "Event", "name": "Feria Effix 2026 — Accesos VIP y Black",
    "startDate": "2026-10-15T09:00:00-05:00", "endDate": "2026-10-19T20:00:00-05:00",
    "location": { "@type": "Place", "name": "Plaza Mayor Medellín" } },
  { "@type": "Event", "name": "Feria Effix 2026 — Entrada General",
    "startDate": "2026-10-16T09:00:00-05:00", "endDate": "2026-10-18T20:00:00-05:00",
    "location": { "@type": "Place", "name": "Plaza Mayor Medellín" } }
]
```

## 3. Cumplimiento de Google (Event rich results)
- **Obligatorios presentes:** `name`, `startDate`, `location.name` + `location.address`. ✅
- **Recomendados presentes:** `endDate`, `image`, `description`, `offers`, `organizer`, `eventAttendanceMode`, `eventStatus`. ✅
- El único bloqueante para "válido con advertencias → válido" es completar `image` y los
  precios placeholder. Con `image` real, pasa limpio.
- Validar en: https://search.google.com/test/rich-results (pegar la URL o el código).

## 4. Cómo insertarlo (según lo que tenga el sitio)

**Paso 0 — detectar si hay plugin SEO** (quien tenga acceso):
- Ver el código fuente de una página (Ctrl+U) y buscar: `yoast`, `rank-math`, `aioseo`.
  - **RankMath:** Panel → Rank Math → Schema → agregar "Event" con estos campos (tiene editor visual de schema; NO pegar JSON manual además, para no duplicar).
  - **Yoast SEO:** el free no hace Event; con Yoast, insertar el JSON-LD manual (ver abajo) evitando choque (Yoast no genera Event, así que no hay duplicado).
  - **AIOSEO:** Panel → Search Appearance → Schema → agregar Event.

**Si NO hay plugin de schema (inserción manual):**
- Opción A (recomendada, todo el sitio): pegar el `<script type="application/ld+json">`
  en `functions.php` del tema hijo con un hook `wp_head`:
  ```php
  add_action('wp_head', function () {
    if (is_front_page() || is_page('entradas')) {
      echo '<script type="application/ld+json">{ ...pegar el JSON aquí... }</script>';
    }
  });
  ```
- Opción B (por página, sin tocar código): en Elementor, agregar un widget **HTML**
  al inicio de la página y pegar ahí el bloque `<script>`.

**Importante:** insertar el schema **una sola vez por página** (si el plugin ya lo genera,
no pegar además el manual — Google penaliza el schema duplicado/contradictorio).

---

## ✅ Verificado vía Wayback (head real del home, snapshot 2026-05)
- **Plugin SEO instalado: Yoast SEO v27.5** (+ Site Kit by Google). El schema se aplica
  con Yoast o de forma compatible con su grafo.
- Yoast YA emite un `application/ld+json` (`yoast-schema-graph`) con `@type` **WebPage +
  Organization**, pero **NO incluye Event**. Hay que **agregar el Event sin duplicar** el grafo:
  - **Recomendado:** engancharlo al grafo de Yoast con el filtro `wpseo_schema_graph`
    (en functions.php), así queda UN solo JSON-LD y no dos bloques separados.
  - Alternativa: inyectar el Event de este doc por `wp_head` en functions.php, o un plugin
    de schema de eventos — cuidando no duplicar entidades.
  - Yoast Free no genera `Event` desde su UI: por eso va por código.
- **og:image real actual** = `https://feriaeffix.com/wp-content/uploads/2025/12/img-logo-feria-effix-2026-3.webp`
  → es el **logo**, no un banner. Recomendación: subir un **banner del evento 1200×630**
  (con fecha + lugar) y setearlo como og:image en Yoast (pestaña Social); usar esa URL en el
  campo `image` del schema. Mientras tanto, el schema puede usar la URL del logo de arriba.
