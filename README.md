# Adc-alt.github.io

Portfolio personal con estética de máquina recreativa.
En vivo: **https://adc-alt.github.io/**

Sitio estático generado con Astro. El HTML de todas las páginas se genera en el
build; el único JavaScript del sitio es el comecocos de la portada (~10 KB), la
pantalla de arranque (inline) y un easter egg de 20 líneas. Las demás páginas no
cargan nada.

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Portada. **Con pantalla de arranque** la primera visita |
| `/work/` | La misma portada **sin arranque, siempre**. Es la URL del CV |
| `/proyectos/`, `/proyectos/<id>/`, `/perfil/` | El resto |

`/work/` lleva `noindex` y canonical a `/`, y está fuera del sitemap: es el
mismo contenido y no debe competir consigo mismo en Google.

## Arrancar

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | `astro check` (tipos) + build a `dist/` |
| `pnpm preview` | Sirve `dist/` como lo hará producción |
| `pnpm check` | Solo la comprobación de tipos |

## Estructura

```
src/
├── consts.ts                 nombre, URL, menú y enlaces sociales
├── content.config.ts         schema Zod de los proyectos
├── content/proyectos/*.md    un fichero = un proyecto = una URL
├── styles/global.css         TODO el sistema de diseño (tokens + componentes)
├── layouts/Base.astro        <head>, SEO, capas de CRT
├── components/
└── pages/
    ├── index.astro
    ├── perfil.astro
    ├── 404.astro
    └── proyectos/
        ├── index.astro
        └── [...id].astro     ficha de cada proyecto
```

## Añadir un proyecto

Copia `src/content/proyectos/_plantilla.md`, renómbralo (**el nombre del
fichero es la URL**) y pon `draft: false`.

El frontmatter está validado con Zod en `src/content.config.ts`: si falta un
campo o el `status` no es uno de los tres válidos, **el build falla**. No se
puede desplegar una tarjeta a medias.

Los ficheros con `draft: true` se ven en `pnpm dev` pero **no se publican**.

## Cambiar el tema

Toda la paleta y la tipografía están en el bloque `@theme` de
`src/styles/global.css`. Son unas veinte variables; no hay nada de color
repartido por los componentes.

## ⚠️ Regla de tipografía

**Press Start 2P solo tiene ASCII.** No trae `Á É Í Ó Ú Ñ` en mayúscula.
Un acento en un texto que use la fuente display cae al fallback y se ve de
otra tipografía a media palabra (`EN LíNEA`, `ESCRITORIO Y MoVIL`).

Va en fuente display: los `h1/h2/h3`, `.hud-label`, `.btn-arcade`,
`.btn-ghost`, el menú y los títulos de proyecto. **Escribe esos textos sin
acentos.** Por eso el menú dice «Perfil» y no «Sobre mí», y el estado dice
«ACTIVO» y no «EN LÍNEA».

El texto normal usa JetBrains Mono, que sí tiene todo el latín: ahí escribe
con acentos con total normalidad.

## Deploy

Push a `main` → GitHub Actions (`.github/workflows/deploy.yml`) hace el build
y publica. Unos 40-60 segundos. No hay que tocar nada a mano.

El origen de Pages es **GitHub Actions**, no «deploy from a branch». `dist/`
no se commitea.

## Accesibilidad

- Todas las animaciones están detrás de `prefers-reduced-motion`.
- Foco visible siempre (`:focus-visible` en ámbar, nunca `outline: none`).
- Enlace de «saltar al contenido» como primer elemento tabulable.
- Las capas de CRT son `aria-hidden` y `pointer-events: none`.

## Pantalla de arranque

`src/components/Boot.astro` + `src/components/boot-data.mjs`. POST de BIOS falso
que tapa la portada la primera vez. Se salta con cualquier tecla, clic o toque.

**Es un homenaje calcado a la pantalla de arranque de
[senna.social](https://senna.social/).** La maqueta, los colores, los tiempos y
el texto son suyos; aquí solo cambia la identidad (el nombre, ADCSOFT y un
sello y un pingüino dibujados aquí en lugar de sus dos imágenes). No se copia
ningún fichero suyo: los dibujos son SVG propios.

Las medidas, con capturas y el porqué de cada número, están en
`docs/superpowers/specs/2026-08-14-arranque-paridad-senna.md`.

Para cambiar el texto o los tiempos, `boot-data.mjs` — pero **`boot-data.test.mjs`
te va a parar**, porque comprueba los valores contra la tabla de la referencia.
Es a propósito: si cambias un número, que sea sabiendo que dejas de copiarla.

Cuatro cosas que parecen detalles y sostienen todo lo demás:

- **La tipografía tiene que ser la variante `AcPlus`** (aspect-corrected), no
  `Web437` ni `WebPlus`. La IBM VGA 8x16 se veía en una VGA de 720x400 estirada
  a una pantalla 4:3, o sea con el píxel más alto que ancho; `AcPlus` lleva ese
  estirón dentro (avance 0,4167em en vez de 0,5em). Con `WebPlus` las letras
  salen cuadradas y anchas y el parecido se rompe aunque cuadre todo lo demás.
- **No hay fundido.** El `transition: visibility 0s .5s` mantiene cada línea
  escondida mientras su opacidad sube, así que aparece de golpe y 500 ms más
  tarde de lo que dice la tabla. Es un fallo de la referencia, pero se ve, y se
  copia. No lo "arregles".
- **La pausa de 1,1 s antes de los chequeos no es un descuido.** Es lo que hace
  que parezca una máquina probándose a sí misma en vez de texto apareciendo. El
  último chequeo, además, tarda 450 ms más que los otros.
- **Las columnas van en `ch`, no en píxeles.** A 24 px un `ch` de esta fuente
  mide 9,99 px, así que `20ch` son los 200 px de la referencia clavados, y
  además encogen solos cuando el móvil baja la fuente a 16 px.

Va en el slot `overlay` del layout, fuera de `<main>`: dentro no funciona,
porque `<main>` tiene `z-10` y un `position:fixed` se queda atrapado en ese
contexto de apilamiento por muy alto que le pongas el z-index. El portfolio
entero está en el HTML detrás, así que los buscadores y las tarjetas de
previsualización ven el sitio y no el arranque.

Todo su JS es `is:inline` y **la pantalla se enseña desde el script**, no se
esconde desde él: si el JS falla, el visitante ve el portfolio; al revés vería
una pantalla negra sin salida.

Para volver a verla: borra `boot_seen` de `localStorage`.

Tipografía **AcPlus IBM VGA 8x16** de
[VileR](https://int10h.org/oldschool-pc-fonts/), CC BY-SA 4.0, en
`public/fonts/` con su licencia al lado. El crédito que exige está en el pie del
sitio. El `.woff2` se sacó del pack `_win` (los `Ac` no vienen en el pack web)
convirtiendo el TTF con `fonttools`.

## Easter egg

↑ ↑ ↓ ↓ ← → ← → B A
