# Auditoría feriaeffix.com — 6 páginas restantes (solo lectura)

Fuente: WebFetch (el WAF bloquea HTTP crudo). Sitio WordPress + Elementor, en vivo.
Contexto: WhatsApp correcto **573227128649**; incorrecto **573206556725**. Fechas
oficiales: VIP/Black 15–19 oct 2026 · General 16–18 oct 2026.

## 🔴 Crítico
| Hallazgo | Página(s) | Detalle |
|---|---|---|
| **Número WhatsApp incorrecto** (573206556725) | **/boleta-black/** | Aparece junto al correcto 573227128649. Sumar a la lista de correcciones (ya estaba en home + footer `wa.link/d7o312`). |
| **Contradicción de fechas 15–19 vs 16–18** sin distinción | **/entrada-vip/** | Muestra "Del 15 al 19" y "Del 16 al 18" pegados (mismo patrón que home y /entradas/). |
| **Fechas de edición pasada mezcladas** | **/que-dicen-de-nosotros/** | La cobertura de medios cita "22–24 ago 2025" (edición anterior) junto a promo de octubre 2026 → confuso para el visitante. |

## 🟡 Importante (SEO / consistencia)
| Hallazgo | Página(s) | Detalle |
|---|---|---|
| **Títulos como imágenes .webp** (no texto real) | Las 6 páginas | Confirmado site-wide (ej. `img-titulo-contacto-...webp`). |
| **Link/nombre "Directorio de marcas 2025"** en el menú | Todas | El menú de navegación referencia 2025; actualizar a 2026 o al destino correcto. |
| **`<title>` de la página dice "2025"** | /directorio-marcas/ | El título de la pestaña/SEO dice 2025 aunque el contenido es 2026 → corregir title + meta. |
| **Menú de navegación duplicado** (verbatim, aparece 2 veces) | /entrada-vip/, /embajadores/ | Widget de menú repetido; limpiar duplicado. |
| **Rutas de imagen `uploads/2025/` y memorias 2024** | /boleta-black/ | Contenido reciclado; revisar que no confunda edición. |

## 🟢 Deseable
| Hallazgo | Página(s) | Detalle |
|---|---|---|
| **Botones de compra como imagen** (.webp) | /entrada-vip/ | Pasar a botón HTML (mejor SEO/peso/contraste). En /boleta-black/ ya son enlaces HTML con logos Wompi/ePayco. |

## Datos capturados (para schema y contacto)
- **Precio VIP:** 1.155.000 COP (IVA incluido) — /entrada-vip/
- **Precio Black:** USD 997 (promo; valor declarado USD 1.323; 4 cuotas de USD 250) — /boleta-black/
- **Email:** gerencia@feriaeffix.com — /contacto/
- **Dirección:** TV. 39B # 76 – 19, Medellín, Colombia — /contacto/
- **Organizador:** EFFIX S.A.S

## Dónde NO aparece el número incorrecto (OK)
/entrada-vip/, /directorio-marcas/, /que-dicen-de-nosotros/, /contacto/, /embajadores/ usan solo **573227128649**.

## Mapa consolidado del número incorrecto (573206556725) a corregir
1. Home — botón "ADQUIERE TU STAND"
2. /boleta-black/ — (esta auditoría)
3. Footer social `wa.link/d7o312` (redirige a 573206556725, texto "2025") — site-wide
