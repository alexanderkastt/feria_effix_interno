# Feria Effix 2026 — Metadescripciones y Open Graph (Bloque 2 · SEO)

> Handoff para aplicar en WordPress. Fechas oficiales: **VIP y Black 15–19 oct 2026** · **General 16–18 oct 2026**. Sede: Plaza Mayor, Medellín. Organiza: EFFIX S.A.S.
> Todas las metadescripciones ≤160 caracteres y únicas por página.

| Página | Meta description | og:title | og:description |
|---|---|---|---|
| **home /** | Feria Effix 2026, el evento de e-commerce de LATAM en Plaza Mayor, Medellín. VIP y Black 15–19 oct · General 16–18 oct. Asegurá tu entrada. | Feria Effix 2026 · El evento de e-commerce en Medellín | 3 días de ponentes, stands y networking. VIP/Black 15–19 oct · General 16–18 oct 2026. Comprá tu entrada. |
| **/entradas/** | Entradas Feria Effix 2026: Pasaporte 3 días, VIP y Black. General 16–18 oct · VIP/Black 15–19 oct. Elegí tu acceso y comprá online. | Entradas Feria Effix 2026 · General, VIP y Black | Elegí tu acceso al mayor evento de e-commerce de Medellín. General 16–18 oct · VIP/Black 15–19 oct 2026. |
| **/entrada-vip/** | Entrada VIP Feria Effix 2026 (1.155.000 COP): rueda de negocios, masterminds, zona VIP, cena exclusiva e ingreso preferencial. 15–19 oct. | Entrada VIP · Feria Effix 2026 | Acceso total: masterminds, rueda de negocios, zona VIP y cena exclusiva. 15–19 oct 2026, Plaza Mayor Medellín. |
| **/boleta-black/** | Entrada Black Feria Effix 2026 (997 USD): 9 mentorías con ponentes, buffet 3 días, networking premium y descuentos en hotel. 15–19 oct. | Entrada Black · Feria Effix 2026 | El acceso premium: 9 mentorías exclusivas, buffet, networking y beneficios. 15–19 oct 2026, Medellín. |
| **/quiero-tener-un-stand/** | Reservá tu stand en Feria Effix 2026 y exponé tu marca ante miles de compradores del e-commerce. Plaza Mayor, Medellín, octubre 2026. | Quiero un stand · Feria Effix 2026 | Exponé tu marca en el mayor evento de e-commerce de LATAM. Reservá tu stand para octubre 2026 en Medellín. |
| **/quiero-producir-mi-stand/** | Proveedores oficiales para producir tu stand en Feria Effix 2026. Diseño, montaje y mobiliario para destacar en Plaza Mayor, Medellín. | Producí tu stand · Feria Effix 2026 | Conectá con proveedores oficiales de diseño y montaje de stands para Feria Effix 2026, Medellín. |
| **/patrocinadores/** | Patrociná Feria Effix 2026 y posicioná tu marca ante la comunidad de e-commerce de LATAM. Planes por tier. Plaza Mayor, Medellín, octubre. | Patrocinadores · Feria Effix 2026 | Sé patrocinador del evento de e-commerce líder en Medellín. Visibilidad ante miles de emprendedores. Octubre 2026. |
| **/ponentes/** | Conocé los ponentes confirmados de Feria Effix 2026 y postulate a la convocatoria oficial. Expertos en e-commerce, IA y marketing digital. | Ponentes · Feria Effix 2026 | Referentes de e-commerce, marketing e IA en el escenario de Feria Effix 2026. Convocatoria abierta. |
| **/directorio-marcas/** | Directorio de marcas expositoras de Feria Effix 2026. Descubrí las empresas de e-commerce presentes en Plaza Mayor, Medellín. | Directorio de marcas · Feria Effix 2026 | Explorá las marcas y expositores de Feria Effix 2026 en Medellín. |
| **/que-dicen-de-nosotros/** | Testimonios y cobertura de prensa de Feria Effix. Mirá lo que vivieron expositores y asistentes en el evento de e-commerce de Medellín. | Qué dicen de nosotros · Feria Effix | Testimonios reales y prensa sobre Feria Effix, la feria de e-commerce de Medellín. |
| **/contacto/** | Contactá al equipo de Feria Effix 2026: gerencia@feriaeffix.com o +57 322 712 8649. Plaza Mayor, Medellín — octubre 2026. | Contacto · Feria Effix 2026 | ¿Dudas sobre entradas, stands o patrocinios? Escribinos. Feria Effix 2026, Medellín. |
| **/embajadores/** | Sé embajador de Feria Effix 2026: ganá 20% por entrada, 5% por stand y 2% por patrocinio, más accesos VIP. Sumate al programa. | Programa de embajadores · Feria Effix 2026 | Creadores e influencers: monetizá promocionando Feria Effix 2026 y accedé a eventos VIP. |

## Correcciones puntuales de metadatos
- **/entradas/ — QUITAR el meta de Twitter "Tiempo de lectura: 15 minutos".** Proviene de una plantilla de blog/artículo y no aplica a una página de venta de boletas. (Etiqueta tipo `twitter:label1 = Tiempo de lectura` / `twitter:data1 = 15 minutos`, o `twitter:label1`/`Est. reading time` inyectada por el plugin SEO al detectar la plantilla como "post").

## Cómo aplicarlo según el plugin SEO
No pude confirmar el plugin instalado (el WAF bloquea la lectura del `<head>` por HTTP; hace falta revisar en el admin o con el navegador). Instrucciones para los 3 más comunes:

- **Yoast SEO:** editar cada página → panel "Yoast SEO" abajo del editor → "Meta description" + pestaña "Social" (Facebook = OG, X/Twitter). Para quitar el "Tiempo de lectura": Yoast no lo inyecta por defecto; suele venir de **RankMath** o de un tema/plugin de blog.
- **RankMath:** editar página → botón "Rank Math SEO" → "Edit Snippet" (Description) y pestaña "Social". El "Tiempo de lectura" en Twitter lo agrega RankMath cuando el tipo de contenido está marcado como Article: en **Rank Math → Titles & Meta → (tipo de esa página)**, desactivar el schema/tipo "Article" o el toggle de reading time.
- **All in One SEO (AIOSEO):** editar página → sección "AIOSEO Settings" → "Snippet" + pestaña "Social".

## Notas (fuera de alcance, para el reporte del padre)
- **/directorio-marcas/** todavía dice "Directorio de marcas **2025**" y no muestra un listado real de expositores — actualizar año y contenido.
- **/contacto/** confirma el número correcto **+57 3227128649** (coincide con la decisión de usar 573227128649).

---

## ✅ Verificado vía Wayback
- **Plugin SEO = Yoast SEO v27.5.** Aplicar TODAS las metas de este doc con Yoast:
  editar cada página → campo "Meta description", y pestaña "Social" para og:title/og:description.
  (Ignorar las instrucciones para RankMath/AIOSEO.)
- **Meta description ACTUAL del home** (a reemplazar): *"Feria Effix 2026 llega a Medellín del
  16 al 18 de Octubre. La Feria de comercio electrónico más grande del mundo..."* → dice solo
  16–18 (General), sin distinguir VIP/Black 15–19.
- **Tag "Tiempo de lectura"** (en /entradas/): no es default de Yoast; suele venir del **tema**
  o de marcar la página como *Article*. Quitarlo: en Yoast, en /entradas/, revisar el tipo de
  contenido/schema (que NO sea Article); si persiste, viene del tema → eliminar el meta
  `twitter:label`/`twitter:data` "Tiempo de lectura" desde el tema (child theme).
