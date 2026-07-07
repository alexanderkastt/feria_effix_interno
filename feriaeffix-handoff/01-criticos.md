# Feria Effix 2026 — Correcciones CRÍTICAS (Bloque 1)

> Handoff para quien tenga acceso admin de WordPress/Elementor (o SSH/WP-CLI).
> Sitio **en vivo vendiendo boletas** — probar en staging o con cuidado y
> confirmar antes de publicar. Decisiones ya confirmadas por el cliente.

---

## FIX 1 — WhatsApp: reemplazar `573206556725` → `573227128649`

**Número correcto (confirmado):** `573227128649` (el usado en header, footer y todas
las páginas de stand). El número `573206556725` es de la edición 2025 y hay que eliminarlo.

Aparece MAL en **tres** lugares (todos apuntan a 573206556725):

**a) Botón "ADQUIERE TU STAND" del home**
- Editor Elementor → editar el home → clic en el botón "ADQUIERE TU STAND" →
  pestaña **Contenido** → campo **Enlace** → cambiar
  `https://api.whatsapp.com/send?phone=573206556725&text=...`
  por `https://api.whatsapp.com/send?phone=573227128649&text=Quiero%20mi%20stand%20feria%20Effix%202026%20%F0%9F%94%A5`

**b) Botón/enlace de WhatsApp en `/boleta-black/`**
- Mismo procedimiento en Elementor: editar /boleta-black/ → el botón/enlace de WhatsApp que
  use `573206556725` → cambiar a `573227128649`.

**c) Ícono "Whatsapp" del footer (link `wa.link/d7o312`) — está en TODAS las páginas**
- `wa.link/d7o312` hoy redirige a `573206556725` **y** con texto viejo *"feria Effix 2025"*.
- **Opción recomendada:** entrar al panel de **walink.io** (cuenta donde se creó `d7o312`)
  y editar su destino a `573227128649` y el texto a "...2026". Con esto se corrige el
  footer de todo el sitio de una sola vez, sin tocar Elementor.
- **Alternativa:** en Elementor, reemplazar el enlace del ícono de WhatsApp del footer
  (widget de íconos sociales) por
  `https://api.whatsapp.com/send?phone=573227128649&text=Quiero%20mi%20stand%20feria%20Effix%202026`.

**Verificación extra (si hay acceso a BD/WP-CLI):** buscar `573206556725` en toda la
base para descartar más apariciones:
`wp db search 573206556725` (o buscar en `wp_postmeta`/`wp_posts` con phpMyAdmin, con backup previo).

---

## FIX 2 — Bloque de fechas duplicado/contradictorio en el hero

**Dato oficial (confirmado):**
- Accesos **Black y VIP: 15 al 19 de octubre de 2026**
- **Entrada General: 16 al 18 de octubre de 2026**

**Problema:** en el hero de **home** y **/entradas/** conviven dos bloques ("Del 15 al 19"
y "Del 16 al 18") sin distinción, uno debajo del otro. La FAQ de /entradas/ ya lo aclara bien.

**Corrección:** dejar **UN SOLO** bloque de fecha que diga:
> **VIP y Black: 15–19 oct · General: 16–18 oct · 2026**

- Elementor → en la sección hero, identificar los **dos** widgets de fecha → **eliminar
  el duplicado** → editar el que queda con el texto unificado de arriba.
- Si las fechas hoy son **imágenes**, aprovechar para reemplazarlas por un **widget de
  Texto/Encabezado** con ese texto (arregla la contradicción **y** suma para SEO — ver Bloque 2).

---

## FIX 3 — Contradicción de ponentes en /entradas/

**Confirmado:** el listado real de ponentes es el de **/ponentes/**. El bloque de /entradas/
(8 fotos: Amadeo Lladós, Vilma Núñez, Felipe Vergara, Aida Victoria Merlano, Rigo Urán,
Daniel Tirado, Javi Rodríguez, Valentina Ortiz) está **reciclado/desactualizado** y encima
va acompañado del texto contradictorio *"Muy pronto revelaremos los ponentes oficiales"*.

**Corrección en /entradas/:**
1. **Borrar** el texto "Muy pronto revelaremos los ponentes oficiales de la feria Effix 2026".
2. **Reemplazar las 8 fotos viejas** por el listado real de /ponentes/, **o** —más simple y
   sin riesgo de volver a desactualizar— por un **botón "Ver ponentes confirmados"** que
   enlace a **/ponentes/**.

---

> **Ojo:** el conflicto de fechas del hero (FIX 2) también aparece en **/entrada-vip/**,
> además de home y /entradas/. Aplicar el mismo criterio en las tres.

---

## FIX 4 — Contenido reciclado de la edición 2025 (limpiar antes de más pauta)

La auditoría encontró un cluster de contenido viejo que confunde y da mala señal:
- **Menú "Directorio de marcas 2025"** en el header de **todas** las páginas → cambiar a "2026".
- **/directorio-marcas/**: el `<title>` y el contenido dicen **"2025"** y no hay listado real
  de expositores 2026 → actualizar título y contenido (o despublicar hasta tener el listado).
- **/que-dicen-de-nosotros/**: mezcla fechas de la edición pasada **"22–24 ago 2025"** con la
  promo 2026 → corregir las fechas viejas.
- **Menú duplicado** renderizado en **/entrada-vip/** y **/embajadores/** → revisar la
  plantilla/encabezado de Elementor de esas páginas.

---

## Regla de publicación
Sitio en vivo con pauta activa. Aplicar en staging o en horario de bajo tráfico, revisar en
móvil y escritorio, y **confirmar antes de publicar cada cambio**. Ver checklist en `05-checklist.md`.
