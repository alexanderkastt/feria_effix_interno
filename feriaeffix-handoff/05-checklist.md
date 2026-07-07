# Feria Effix 2026 — Checklist de verificación post-cambios (Bloque 5)

> Revisar **en el sitio en vivo, en móvil y escritorio**, después de aplicar cada bloque.
> No dar nada por publicado hasta completar esta lista.

## Críticos (Bloque 1)
- [ ] El hero (home, /entradas/, /entrada-vip/) muestra **un solo** bloque de fecha:
      "VIP y Black: 15–19 oct · General: 16–18 oct · 2026". No hay dos bloques contradictorios.
- [ ] Botón "ADQUIERE TU STAND" del home abre WhatsApp a **573227128649** (no 3206556725).
- [ ] Botón de WhatsApp en /boleta-black/ va a **573227128649**.
- [ ] Ícono de WhatsApp del footer (wa.link/d7o312) va a **573227128649** y el texto dice **2026** (no 2025).
- [ ] En /entradas/ ya no está el texto "Muy pronto revelaremos los ponentes" y las fotos
      viejas fueron reemplazadas por el listado real de /ponentes/ (o un botón a /ponentes/).
- [ ] Menú dice "Directorio de marcas **2026**"; /directorio-marcas/ y /que-dicen-de-nosotros/
      ya no muestran fechas/textos de **2025**.

## SEO (Bloque 2)
- [ ] Los títulos principales son **texto real** (H1/H2), no imágenes (revisar con clic derecho
      → "Inspeccionar" que sean `<h1>`/`<h2>`, o con la extensión "Web Developer" → Outline headings).
- [ ] Un solo **H1 por página**.
- [ ] El **schema de Event** aparece y valida en
      https://search.google.com/test/rich-results (probar la URL del home y /entradas/).
- [ ] Cada página tiene **meta description única** (verificar en el código fuente o con el plugin SEO).
- [ ] El meta de Twitter **"Tiempo de lectura"** ya NO aparece en /entradas/.

## CRO (Bloque 3)
- [ ] Los 3 botones de boleta (Pasaporte 3 días / VIP / Black) son botones reales, con buen
      contraste (CTA en azul #1A6FFF), y se ven completos en móvil (ninguno tapado por overlap).
- [ ] El logo del header no ocupa un espacio desproporcionado en móvil.
- [ ] El contador de "Etapa actual" es editable desde el panel de WordPress (Ajustes → Etapa Effix)
      y se refleja en el sitio sin generar una imagen nueva.

## Rendimiento (Bloque 4)
- [ ] Score de PageSpeed medido (móvil y escritorio) en home y /entradas/ — anotar antes/después.
- [ ] Plugin de caché activo y configurado.
- [ ] Imagen LCP del hero sin lazy-load; el resto con lazy-load.

## Prueba funcional final
- [ ] Comprar-flow: los 3 botones llevan a la pasarela correcta (La Tiquetera / Wompi / ePayco).
- [ ] Todos los WhatsApp del sitio abren el número correcto con texto 2026.
- [ ] Sin errores visibles de layout en iPhone/Android y en escritorio.
