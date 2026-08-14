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

`src/components/Boot.astro`. POST de BIOS falso que tapa la portada la primera
vez. Se salta con cualquier tecla, clic o toque, y entra sola a los ~3 s.

Para cambiar el texto, toca solo `HEAD`, `SPECS`, `DEVICES` y `TAIL` del
frontmatter: las columnas y los tiempos se calculan a partir de ahí.
**Máximo 44 caracteres por línea** o desborda en un móvil de 390 px.

Tipografía **VT323** (`@fontsource/vt323`), que se importa dentro del propio
componente y por eso solo se descarga en `/`. Es una fuente de mapa de bits:
los tamaños van en píxeles enteros (16 en móvil, 20 a partir de 640 px) y sin
`clamp()`, o se ve sucia.

La paleta no es monocroma a propósito: etiqueta en cian, valor en blanco y
veredicto en verde/ámbar/magenta según lo bien que haya ido. Los POST de
verdad tampoco eran de un solo color. Y no lleva scanlines ni viñeteado: la
referencia (`senna.social`) no tiene ninguno y es lo primero que convierte el
homenaje en parodia.

Tres cosas que parecen detalles y no lo son:

- Todo su JS es `is:inline` y **la pantalla se enseña desde el script**, no se
  esconde desde él. Si el JS falla, el visitante ve el portfolio; al revés
  vería una pantalla negra sin salida.
- Va en el slot `overlay` del layout, fuera de `<main>`. Dentro no funciona:
  `<main>` tiene `z-10` y un `position:fixed` se queda atrapado en ese contexto
  de apilamiento por muy alto que le pongas el z-index.
- El portfolio entero está en el HTML detrás del overlay, así que los
  buscadores y las tarjetas de previsualización ven el sitio, no el arranque.

Para volver a verla: borra `boot_seen` de `localStorage`.

## Easter egg

↑ ↑ ↓ ↓ ← → ← → B A
