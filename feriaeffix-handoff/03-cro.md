# Feria Effix — Handoff CRO (Bloque 3)

> Sitio **WordPress + Elementor**, EN VIVO con pauta activa. Todo esto es
> **para aplicar por quien tenga acceso admin** (no se toca en vivo sin prueba).
> Paleta de marca: negro `#0D0D0D` + azul eléctrico `#1A6FFF`. **Nunca naranja.**
> Regla de oro: cada cambio se prueba en una página de staging o en preview de
> Elementor y se compara **antes/después** antes de publicar.

---

## 1) Botones de boleta en HTML+CSS real (reemplazan las imágenes .webp)

### Antes → Después
- **Antes:** 3 imágenes `.webp` (Pasaporte 3 días / VIP / Black). Pesan ~40–120 KB
  c/u, no tienen texto real (malo para SEO y lectores de pantalla), no cambian de
  color al pasar el mouse, y el CTA negro "se pierde" sobre fondo oscuro.
- **Después:** 3 botones HTML (~0 KB extra), con texto real, foco accesible,
  hover, y el **CTA principal en azul `#1A6FFF`** para que resalte sobre el negro.

### Código (pegar en un widget **HTML** de Elementor donde hoy están las imágenes)

```html
<div class="efx-tickets">
  <a class="efx-btn efx-btn--pass" href="URL_PASAPORTE_3DIAS">
    <span class="efx-btn__kicker">Pasaporte</span>
    <span class="efx-btn__title">3 días</span>
    <span class="efx-btn__cta">Comprar entrada</span>
  </a>

  <a class="efx-btn efx-btn--vip" href="URL_VIP">
    <span class="efx-btn__kicker">Entrada</span>
    <span class="efx-btn__title">VIP</span>
    <span class="efx-btn__cta">Comprar VIP</span>
  </a>

  <a class="efx-btn efx-btn--black" href="URL_BLACK">
    <span class="efx-btn__kicker">Boleta</span>
    <span class="efx-btn__title">Black</span>
    <span class="efx-btn__cta">Comprar Black</span>
  </a>
</div>

<style>
  .efx-tickets{
    display:grid; grid-template-columns:repeat(3,1fr); gap:16px;
    max-width:960px; margin:0 auto;
  }
  .efx-btn{
    display:flex; flex-direction:column; gap:4px;
    padding:22px 20px; border-radius:14px; text-decoration:none;
    border:1px solid rgba(255,255,255,.12);
    background:#141414; color:#ededed;
    transition:transform .15s ease, box-shadow .15s ease, border-color .15s ease;
    font-family:inherit;
  }
  .efx-btn:hover{ transform:translateY(-3px); border-color:#1A6FFF;
    box-shadow:0 10px 30px rgba(26,111,255,.25); }
  .efx-btn:focus-visible{ outline:3px solid #1A6FFF; outline-offset:2px; }
  .efx-btn__kicker{ font-size:13px; letter-spacing:.12em; text-transform:uppercase; opacity:.7; }
  .efx-btn__title{ font-size:30px; font-weight:800; line-height:1; }
  .efx-btn__cta{
    margin-top:14px; align-self:flex-start;
    padding:10px 16px; border-radius:10px; font-weight:700; font-size:15px;
  }

  /* CTA principal (VIP) en azul de marca para que resalte */
  .efx-btn--vip{ border-color:#1A6FFF; background:#0d2144; }
  .efx-btn--vip .efx-btn__cta{ background:#1A6FFF; color:#fff; }
  .efx-btn--vip:hover{ box-shadow:0 12px 34px rgba(26,111,255,.4); }

  /* Pasaporte y Black: CTA azul outline sobre negro */
  .efx-btn--pass .efx-btn__cta,
  .efx-btn--black .efx-btn__cta{
    background:transparent; color:#1A6FFF; border:2px solid #1A6FFF;
  }
  .efx-btn--pass:hover .efx-btn__cta,
  .efx-btn--black:hover .efx-btn__cta{ background:#1A6FFF; color:#fff; }

  /* Black con un toque premium */
  .efx-btn--black{ background:#0a0a0a; }

  @media (max-width:640px){
    .efx-tickets{ grid-template-columns:1fr; gap:12px; }
    .efx-btn__title{ font-size:26px; }
  }
</style>
```

**Cómo insertarlo en Elementor**
1. Editar la página → seleccionar la sección con las 3 imágenes de boleta.
2. Arrastrar un widget **HTML** en su lugar (o reemplazar el contenido de la
   columna) y pegar el bloque de arriba.
3. Reemplazar `URL_PASAPORTE_3DIAS`, `URL_VIP`, `URL_BLACK` por los links de
   compra reales (los mismos a los que hoy enlazan las imágenes).
4. Borrar las imágenes viejas. Publicar solo tras revisar en preview desktop+móvil.

> Alternativa sin HTML crudo: 3 widgets **Botón** de Elementor, cada uno con su
> color (VIP = azul `#1A6FFF`, los otros = borde azul), tipografía en negrita y
> "Hover Animation = Grow". El HTML de arriba es más fiel y liviano.

---

## 2) Contador dinámico de etapa / entradas vendidas (reemplaza la imagen estática)

### Antes → Después
- **Antes:** `img-tabla-etapas-...webp` con "ETAPA ACTUAL: AFICIONADO". Cada vez
  que cambia la etapa, alguien tiene que **diseñar una imagen nueva** y subirla.
- **Después:** un bloque HTML/CSS que lee **campos que marketing edita desde el
  panel de WordPress** (Ajustes) — sin diseñador, en 10 segundos.

### A. PHP para `functions.php` (del tema hijo)

```php
/**
 * Feria Effix — contador de etapa dinámico.
 * Registra dos opciones editables y un shortcode [efx_etapa].
 */

// 1) Página de ajustes simple en el admin (Ajustes → Etapa Effix)
add_action('admin_menu', function () {
    add_options_page('Etapa Effix', 'Etapa Effix', 'manage_options', 'efx-etapa', function () {
        if (isset($_POST['efx_nonce']) && wp_verify_nonce($_POST['efx_nonce'], 'efx_save')) {
            update_option('efx_etapa_actual', sanitize_text_field($_POST['efx_etapa_actual']));
            update_option('efx_entradas_vendidas', sanitize_text_field($_POST['efx_entradas_vendidas']));
            echo '<div class="updated"><p>Guardado.</p></div>';
        }
        $etapa = esc_attr(get_option('efx_etapa_actual', 'Aficionado'));
        $vend  = esc_attr(get_option('efx_entradas_vendidas', ''));
        ?>
        <div class="wrap"><h1>Etapa Effix</h1>
        <form method="post">
            <?php wp_nonce_field('efx_save', 'efx_nonce'); ?>
            <table class="form-table">
              <tr><th>Etapa actual</th><td>
                <input name="efx_etapa_actual" value="<?php echo $etapa; ?>" class="regular-text">
                <p class="description">Ej: Aficionado, Amateur, Profesional…</p></td></tr>
              <tr><th>Entradas vendidas</th><td>
                <input name="efx_entradas_vendidas" value="<?php echo $vend; ?>" class="regular-text">
                <p class="description">Número o texto libre. Dejar vacío para ocultarlo.</p></td></tr>
            </table>
            <?php submit_button(); ?>
        </form></div>
        <?php
    });
});

// 2) Shortcode [efx_etapa] — se pega en un widget Shortcode de Elementor
add_shortcode('efx_etapa', function () {
    $etapas = ['Aficionado', 'Amateur', 'Profesional', 'Élite']; // ajustar al plan real
    $actual = get_option('efx_etapa_actual', 'Aficionado');
    $vend   = get_option('efx_entradas_vendidas', '');
    $idx    = array_search($actual, $etapas, true);

    ob_start(); ?>
    <div class="efx-etapa">
      <?php if ($vend !== ''): ?>
        <p class="efx-etapa__vend"><strong><?php echo esc_html($vend); ?></strong> entradas vendidas</p>
      <?php endif; ?>
      <p class="efx-etapa__label">Etapa actual: <strong><?php echo esc_html($actual); ?></strong></p>
      <div class="efx-etapa__track">
        <?php foreach ($etapas as $i => $e):
          $st = ($idx === false) ? '' : ($i < $idx ? 'done' : ($i === $idx ? 'now' : '')); ?>
          <span class="efx-etapa__step <?php echo $st; ?>"><?php echo esc_html($e); ?></span>
        <?php endforeach; ?>
      </div>
    </div>
    <?php return ob_get_clean();
});
```

### B. CSS (Elementor → Avanzado → CSS personalizado, o en el mismo widget HTML)

```css
.efx-etapa{ max-width:760px; margin:0 auto; text-align:center; color:#ededed; }
.efx-etapa__vend{ font-size:20px; margin:0 0 4px; }
.efx-etapa__label{ font-size:15px; opacity:.85; margin:0 0 14px; }
.efx-etapa__track{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
.efx-etapa__step{
  padding:8px 14px; border-radius:999px; font-size:14px; font-weight:600;
  border:1px solid rgba(255,255,255,.14); background:#141414; color:#9a9a9f;
}
.efx-etapa__step.done{ color:#ededed; border-color:rgba(26,111,255,.4); }
.efx-etapa__step.now{ background:#1A6FFF; color:#fff; border-color:#1A6FFF; }
```

**Cómo lo edita marketing (sin diseñador):**
`WordPress → Ajustes → Etapa Effix` → cambiar "Etapa actual" y "Entradas
vendidas" → Guardar. El bloque se actualiza solo en la página.

**Cómo se inserta una vez:** en Elementor, donde está la imagen de la tabla,
poner un widget **Shortcode** con `[efx_etapa]` y borrar la imagen.

> **ACF es opcional.** Con el código de arriba NO hace falta ningún plugin. Si el
> equipo ya usa Advanced Custom Fields, se pueden reemplazar las `get_option()`
> por `get_field()`; funcionalmente es lo mismo.

---

## 3) Header / logo y botones ocultos en móvil

### Logo — Antes → Después
- **Antes:** logo desproporcionado, sobre todo en móvil (queja del equipo);
  empuja los CTAs fuera de la vista.
- **Después:** tamaños acotados por dispositivo.

Recomendación concreta (Elementor → widget del logo → Estilo → Ancho, o CSS):

```css
/* Desktop */
.site-header .logo img,
.elementor-widget-theme-site-logo img{ max-height:56px; width:auto; }

/* Tablet */
@media (max-width:1024px){ .site-header .logo img{ max-height:48px; } }

/* Móvil: logo chico para dejar el CTA visible */
@media (max-width:640px){ .site-header .logo img{ max-height:38px; } }
```
Regla práctica: en móvil el logo **no** debería ocupar más de ~40 px de alto ni
más del ~40 % del ancho del header, para que el botón de compra entre en la
misma fila o justo debajo, sin scroll.

### Checklist para detectar/arreglar botones de compra ocultos por overlap (móvil)
1. Abrir el sitio en móvil (o DevTools → vista responsive, 360–390 px de ancho).
2. Revisar home y /entradas/: ¿los 3 botones de boleta se ven completos y son
   clickeables, o hay un elemento (imagen/hero) que los tapa?
3. Causas típicas en Elementor y su fix:
   - **Márgenes/alturas fijas en px** que no bajan en móvil → poner el control en
     la pestaña **Responsive** (ícono de dispositivo) y usar valores menores/auto.
   - **`position:absolute` de un widget** montándose sobre otro → cambiar a
     posición por defecto en móvil.
   - **Secciones superpuestas por `z-index`** → asegurar que la sección de CTAs
     tenga `z-index` mayor o quitar el overlap.
4. CSS de rescate (solo si hace falta forzar que los CTAs queden por encima):

```css
@media (max-width:640px){
  .efx-tickets{ position:relative; z-index:5; }
  .site-header{ position:relative; z-index:10; }
}
```
5. Verificar tap-target: cada botón ≥ 44×44 px (guía de accesibilidad móvil).

---

## Orden sugerido de aplicación (menor riesgo primero)
1. Tamaño de logo en móvil (CSS, reversible, cero riesgo).
2. Botones de boleta en HTML (probar links de compra en preview antes de publicar).
3. Checklist de overlap móvil.
4. Contador dinámico (requiere tocar `functions.php` del **tema hijo** — hacer
   backup del archivo antes; si no hay tema hijo, crearlo para no perder el
   cambio en la próxima actualización del tema).

**Nada de esto se publica sin comparar antes/después en preview, dado que hay
pauta activa corriendo.**
