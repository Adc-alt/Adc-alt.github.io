# Adc-alt.github.io

Portfolio personal con estética de máquina recreativa.
En vivo: **https://adc-alt.github.io/**

Sitio estático generado con Astro. **Cero JavaScript** en el bundle salvo un
easter egg de ~20 líneas que va inlineado en el HTML.

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

## Easter egg

↑ ↑ ↓ ↓ ← → ← → B A
