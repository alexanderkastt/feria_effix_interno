# Feria Effix 2026 — Rendimiento (Bloque 4)

> **Nota de método:** intenté correr PageSpeed Insights por su API pública sin clave y
> devolvió **429 (rate limit)**. Para números en vivo, medir con una de estas dos vías
> (ambas gratis) y pegar los scores acá:
> 1. **Web UI (sin clave):** https://pagespeed.web.dev/ → analizar `https://feriaeffix.com/`
>    y `https://feriaeffix.com/entradas/` (móvil y escritorio).
> 2. **API con clave gratis:** crear una API key de PageSpeed Insights en Google Cloud y:
>    `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<URL>&strategy=mobile&key=<KEY>`

Aun sin el score exacto, hay recomendaciones de **alta confianza** por lo que ya sabemos
del sitio (WordPress + Elementor con casi todo el contenido en imágenes WebP):

## Prioridad ALTA (sin rediseño)
1. **Convertir títulos y CTAs de imagen a texto/HTML** (ver Bloques 2 y 3). Además del SEO,
   **reduce peso y número de requests**: cada título/botón-imagen es un archivo extra que
   hoy se descarga. Es la optimización de rendimiento con mejor relación esfuerzo/impacto.
2. **Caché de página + minificación**: instalar/So configurar un plugin de caché
   (**WP Rocket**, **LiteSpeed Cache** o **W3 Total Cache**). Activar: cache de página,
   minificar y **combinar/diferir CSS y JS**, y **lazy load** de imágenes (excluyendo la
   imagen LCP del hero — ver punto 4).
3. **Elementor > Experimentos**: activar "Improved CSS Loading", "Optimized DOM Output",
   "Inline Font Icons" y "Lazy Load Background Images". Elementor carga mucho CSS/JS por
   defecto; estos flags recortan bastante.
4. **Imagen LCP del hero sin lazy-load**: la imagen principal del hero NO debe tener
   `loading="lazy"` (retrasa el LCP). El resto de imágenes, sí.

## Prioridad MEDIA
5. **Comprimir/redimensionar imágenes**: aunque sean `.webp`, revisar que no se sirvan a
   mayor resolución que la mostrada. Un plugin como **ShortPixel** o **Imagify** las
   optimiza en lote y genera tamaños responsive.
6. **Diferir scripts de terceros** (Pixel de Meta, Google Ads/GA4, chat): cargarlos con
   `defer`/`async` o vía Google Tag Manager para que no bloqueen el render inicial.
7. **Precarga de fuentes** críticas y `font-display: swap` para evitar texto invisible.

## Prioridad BAJA
8. Habilitar **HTTP/2 o HTTP/3** y compresión **Brotli/Gzip** en el hosting (suele venir ya).
9. **CDN** (Cloudflare ya parece estar delante por el WAF) — confirmar que cachea estáticos.

## Cómo priorizar
El sitio está en producción con pauta activa: aplicar en este orden y medir entre pasos →
(1) caché + Elementor experiments (bajo riesgo, alto impacto), (2) optimización de imágenes,
(3) reemplazo de títulos/CTAs por texto (que además cierra SEO/CRO). Evitar cambios de
tema/rediseño con pauta corriendo.
