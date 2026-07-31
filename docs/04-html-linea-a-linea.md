# 04 — El HTML línea a línea

Este es el `index.html` entero. 24 líneas. Vamos una por una.

```html
<!DOCTYPE html>
```

No es una etiqueta, es una **declaración**. Le dice al navegador "interpreta esto con las
reglas modernas". Si falta, el navegador entra en *quirks mode*: emula bugs de Internet
Explorer 5 de 1998 para no romper webs antiguas, y tus cajas y márgenes se calculan mal.
Es una línea que no puedes omitir nunca.

```html
<html lang="es">
```

El elemento raíz. Todo lo demás va dentro.

`lang="es"` no es decorativo: los lectores de pantalla eligen la voz y la pronunciación con
ese atributo, y el navegador elige el diccionario del corrector y las reglas de partición de
palabras. Sin `lang`, un lector de pantalla lee español con fonética inglesa. Es el ejemplo
más barato que existe de accesibilidad: un atributo.

```html
<head>
```

Metadatos: información **sobre** el documento, no contenido visible. Nada de lo que hay aquí
se pinta en la página.

```html
  <meta charset="UTF-8">
```

Cómo interpretar los bytes del fichero como texto. UTF-8 cubre todo Unicode: acentos, ñ,
emoji, chino. Sin esto, el navegador adivina, y cuando adivina mal ves `Ã±` donde debería
haber una `ñ`.

Tiene que estar **en los primeros 1024 bytes** del documento, por eso va lo primero del `<head>`:
el navegador empieza a parsear antes de haber leído el fichero entero, y necesita saber ya
cómo decodificarlo.

```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Solo importa en móvil, y es imprescindible.

Historia: cuando salió el iPhone, las webs estaban diseñadas para pantallas de escritorio.
Safari móvil, para no mostrarlas rotas, decidió mentir: fingir que la pantalla mide 980 px de
ancho y luego reducir el resultado. Por eso las webs antiguas se ven en móvil como una versión
en miniatura de la de escritorio.

Esta etiqueta desactiva esa mentira: `width=device-width` significa "el ancho del viewport es
el ancho real del dispositivo". `initial-scale=1.0` significa "no apliques zoom inicial".
Sin ella, ningún diseño responsive funciona: tus `@media` nunca se disparan porque el navegador
cree que está en una pantalla de 980 px.

```html
  <title>Portfolio Antonio</title>
```

Texto de la pestaña. También es lo que sale como **titular azul en Google** y el nombre por
defecto al guardar en marcadores. Es el metadato de SEO más importante que hay.

```html
  <style>
```

CSS embebido en el propio HTML. Se aplica solo a este documento.

Está aquí y no en un `estilos.css` aparte porque son 6 declaraciones y un fichero separado
costaría una petición HTTP extra para ahorrar nada. Cuando el CSS crezca o haya una segunda
página que comparta estilos, se saca fuera con `<link rel="stylesheet" href="estilos.css">`.

```css
    body {
      font-family: system-ui, sans-serif;
```

`system-ui` es la fuente de interfaz del sistema operativo: San Francisco en macOS, Segoe UI en
Windows, Roboto en Android. **Cero descargas**, se ve nativa en cada plataforma, y carga
instantánea. La alternativa —una fuente de Google Fonts— son 2 peticiones más, un parpadeo de
texto sin estilo (*FOUT*) mientras carga, y una dependencia de un tercero.

`sans-serif` detrás es el *fallback*: si un navegador no conoce `system-ui`, usa su sans-serif
genérica. Una lista de fuentes se evalúa de izquierda a derecha hasta que una existe.

```css
      display: grid;
      place-items: center;
      min-height: 100vh;
```

Centrado vertical y horizontal en tres líneas. Esto era, literalmente durante quince años,
el chiste recurrente del desarrollo web ("cómo centrar un div"), y hoy es una propiedad.

- `display: grid` convierte al `<body>` en contenedor grid.
- `place-items: center` es atajo de `align-items: center` (eje vertical) + `justify-items: center`
  (eje horizontal). Centra el contenido en ambos.
- `min-height: 100vh` — `vh` es *viewport height*, 1vh = 1% de la altura de la ventana.
  Hace falta porque por defecto el `<body>` mide **lo que ocupe su contenido**, y centrar
  verticalmente dentro de una caja que mide exactamente lo que contiene no hace nada.

```css
      margin: 0;
```

Los navegadores traen una hoja de estilos por defecto (*user agent stylesheet*) que le pone
al `<body>` un margen de ~8px. Sin quitarlo, el `100vh` de arriba genera scroll: 100% de la
altura **más** 8px arriba y 8 abajo no cabe en la ventana.

Este tipo de ajuste es la razón de que existan los *CSS reset* (normalize.css, y otros).
Para un elemento, una línea; no hace falta una librería.

```html
<body>
  <main>
```

`<body>` es el contenido visible. `<main>` marca el contenido principal de la página —
lo que no es cabecera, menú de navegación ni pie.

Visualmente **no hace nada**. Sirve para dos cosas reales: los lectores de pantalla ofrecen
"saltar al contenido principal" usando esa marca, y Google entiende qué parte de la página
es el contenido de verdad. Es lo que significa *HTML semántico*: usar la etiqueta que
describe qué **es** la cosa, en vez de un `<div>` genérico para todo.

```html
    <h1>Portfolio Antonio</h1>
    <p>Aquí no hay nada todavía.</p>
```

El contenido. `<h1>` es el encabezado de nivel 1: **uno por página**, y es el título real del
documento. Los niveles (`h1` → `h6`) forman un índice jerárquico que se navega con lector de
pantalla; saltarse niveles (un `h1` seguido de un `h4`) rompe esa navegación.

`<p>` es un párrafo.

## Lo que deliberadamente no hay

| Ausente | Por qué |
|---------|---------|
| `<meta name="description">` | Es el texto gris bajo el título en Google. Importa cuando haya contenido real que describir. |
| Etiquetas Open Graph (`og:image`, etc.) | Controlan la tarjeta de previsualización al compartir en WhatsApp/LinkedIn/X. Se añaden cuando la página valga la pena compartirla. |
| `favicon.ico` | El icono de la pestaña. Sin él el navegador pide uno, se come un 404 y pinta el icono genérico. Cosmético, va con el diseño. |
| JavaScript | No hay nada que sea interactivo. |

Cada una de esas es una línea que se añadirá cuando resuelva un problema que existe.

## Fuentes que consulté

- MDN, `<meta name="viewport">`: https://developer.mozilla.org/es/docs/Web/HTML/Reference/Elements/meta
- MDN, `place-items`: https://developer.mozilla.org/en-US/docs/Web/CSS/place-items
- MDN, HTML semántico y accesibilidad: https://developer.mozilla.org/es/docs/Learn_web_development/Core/Accessibility/HTML
- `system-ui` y font stacks del sistema: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
