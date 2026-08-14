---
title: "Este portfolio"
summary: "Sitio estático con estética de recreativa. Sin JS salvo un easter egg, desplegado solo en cada push."
year: 2026
stack: ["Astro", "Tailwind v4", "TypeScript", "GitHub Actions"]
status: "live"
accent: "cyan"
order: 1
featured: true
repo: "https://github.com/Adc-alt/Adc-alt.github.io"
demo: "https://adc-alt.github.io"
---

## El proyecto

El sitio que estás leyendo. Empezó como un `index.html` de 23 líneas para entender
cómo funciona la web por debajo, y se rehízo entero con estética de máquina
recreativa de los 80.

## Decisiones

**Astro y no Next.** El contenido no cambia entre visitantes, así que no hay razón
para enviar un runtime de React al navegador. Astro renderiza a HTML en el build y
manda **cero JavaScript** por defecto. La única línea de JS del sitio es el código
Konami.

**Tailwind v4 con tokens propios.** La paleta entera vive en un bloque `@theme` de
`src/styles/global.css`. Cambiar el tema es cambiar seis variables.

**Content collections tipadas.** Cada proyecto es un Markdown validado con Zod
en tiempo de build. Un campo mal puesto rompe el build en vez de publicar una
tarjeta rota.

**Deploy por GitHub Actions.** Push a `main` → build → Pages. Unos 40 segundos.

## Lo que tiene por dentro

- Overlay de CRT: líneas de barrido, viñeta y un barrido lento vertical, todo CSS.
- Rejilla en perspectiva animada con `transform: perspective()` y una máscara.
- Aberración cromática en el título con dos `text-shadow` desplazados.
- Todo el movimiento detrás de `prefers-reduced-motion`. Sin excepciones.
