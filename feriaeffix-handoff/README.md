# Handoff de auditoría — feriaeffix.com (Feria Effix 2026)

Paquete de auditoría y mejoras para **feriaeffix.com** (WordPress + Elementor), listo para
que lo aplique quien tenga acceso admin (o dev con SSH/WP-CLI). Generado en modo **solo
lectura** (el sitio está en vivo vendiendo boletas; no se aplicó ningún cambio).

## Datos confirmados del evento
- **Feria Effix 2026** · 6ª edición · e-commerce · **Plaza Mayor, Medellín** · Organizador **EFFIX S.A.S**
- Fechas: **VIP y Black 15–19 oct 2026** · **General 16–18 oct 2026**
- WhatsApp correcto: **573227128649** (a eliminar: 573206556725, de 2025)
- Ponentes reales: los de **/ponentes/**
- Marca: negro **#0D0D0D** + azul **#1A6FFF** (nunca naranja)

## Archivos
| Archivo | Contenido |
|---|---|
| `00-auditoria-paginas-restantes.md` | Auditoría de /entrada-vip/, /boleta-black/, /directorio-marcas/, /que-dicen-de-nosotros/, /contacto/, /embajadores/ |
| `01-criticos.md` | **Empezar por acá.** Fixes críticos: WhatsApp, fechas, ponentes, contenido 2025 |
| `02-schema-event.md` | Código Schema.org Event listo para pegar (rich results de Google) |
| `02-metadescripciones.md` | Meta descriptions + OG por página + quitar tag "Tiempo de lectura" |
| `03-cro.md` | Botones de boleta en HTML/CSS, contador dinámico de etapa, logo/overlap móvil |
| `04-rendimiento.md` | Cómo medir PageSpeed + recomendaciones de velocidad |
| `05-checklist.md` | Checklist de verificación en vivo antes de dar por publicado |

## Orden sugerido de aplicación
1. **Críticos** (`01`) — sobre todo el WhatsApp (plata perdida cada día) y las fechas.
2. **SEO** (`02` schema + metas) — con el plugin SEO existente (Yoast/RankMath/AIOSEO).
3. **CRO** (`03`) — botones y contador, con antes/después.
4. **Rendimiento** (`04`).
5. Verificar todo con `05-checklist.md`.

## Verificado vía Wayback Machine (sin necesidad de acceso)
- **Plugin SEO = Yoast SEO v27.5** → todas las instrucciones SEO se aplican con Yoast.
- **Yoast ya emite schema WebPage/Organization pero NO Event** → hay que agregar el Event
  (ver `02-schema-event.md`).
- **og:image actual = el logo** (`.../img-logo-feria-effix-2026-3.webp`) → recomendado
  reemplazar por un banner de evento 1200×630.

## Pendientes que requieren un dato/acceso
- **Precios** de Entrada General y Pasaporte 3 días (están en imágenes ilegibles) → completar
  en el schema. (VIP $1.155.000 COP y Black USD 997 ya confirmados.)
- **Score de PageSpeed** en vivo → correr desde pagespeed.web.dev (la API sin key da 429).
- **Acceso admin** para *aplicar* todo esto (hoy el cliente no lo tiene).
