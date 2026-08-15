---
title: "Este sitio: un escritorio de Windows XP"
summary: "Portfolio en una sola página. El contenido vive en ventanas XP que se arrastran, se minimizan y se cierran, y todas se renderizan en el build."
year: 2026
stack: ["Astro", "TypeScript", "CSS", "GitHub Actions"]
status: "live"
order: 1
repo: "https://github.com/Adc-alt/Adc-alt.github.io"
demo: "https://adc-alt.github.io"
---

## El proyecto

El sitio que estás leyendo. Empezó como un `index.html` de 23 líneas para
entender cómo funciona la web por debajo, pasó por una versión con estética de
máquina recreativa, y ahora es un escritorio de Windows XP: una pantalla de
arranque tipo BIOS, el fondo, la barra de tareas y el portfolio dentro de
ventanas.

## Decisiones

**Nada de esto lo genera el JavaScript.** Las ventanas salen del build como
HTML normal y el script solo las abre, las arrastra y las cierra. Si el
contenido lo pintara el navegador, un buscador vería un escritorio vacío, y
rehacerlo después habría sido reescribir las ventanas enteras.

**El modo apilado es la base y el escritorio es la mejora.** Un escritorio no
se maneja con el dedo, así que por debajo de 720 px las ventanas dejan de ser
absolutas y se apilan en columna. Las reglas del escritorio viven dentro de una
media query y colgando de una clase que pone un script en el `<head>`:
consecuencia buscada, sin JavaScript el sitio cae en el modo apilado, que es
legible. Escrito al revés harían falta dos copias de las mismas reglas.

**Los colores de la barra de tareas están medidos, no estimados.** Salen de
muestrear capturas de XP píxel a píxel, y la derivación entera vive en un
módulo con test. Hay un dato que sí es aproximado —los colores de las
ventanas, porque no encontré una captura nativa que muestrear— y está marcado
como tal en el propio componente. La diferencia entre lo medido y lo puesto a
ojo es la clase de cosa que se olvida en seis meses si no se escribe.

**Astro y cero dependencias de interfaz.** El contenido no cambia entre
visitantes, así que no hay razón para enviar un framework al navegador. Se fue
también Tailwind cuando se retiró la versión arcade: el escritorio es CSS con
ámbito por componente y no lo necesitaba.

## Lo que tiene por dentro

- Pantalla de arranque calcada de una referencia con el inspector: tiempos,
  colores y saltos de línea medidos, no inventados.
- Gestor de ventanas propio: arrastre con Pointer Events, tope para que una
  ventana no se pueda empujar fuera de la pantalla, cascada al abrir y
  `z-index` por orden de uso.
- Content collections tipadas con Zod: un `.md` con un campo mal puesto rompe
  el build en vez de publicar una ventana rota.
- Todo el movimiento detrás de `prefers-reduced-motion`. Sin excepciones.
- Deploy por GitHub Actions. Push a `main` → build → Pages, unos 40 segundos.
