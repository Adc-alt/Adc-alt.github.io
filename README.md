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
vez. Se salta con cualquier tecla, clic o toque.

**No entra sola: espera.** Como la referencia, que a los 25 s sigue en el
arranque si no tocas nada. Antes entraba sola a los 3 s y te la perdías al
parpadear. Si quieres el temporizador de vuelta, pon los milisegundos en
`AUTO_MS` del frontmatter (`0` = esperar).

Para cambiar el texto, toca solo `HEAD`, `SPECS`, `DEVICES` y `TAIL` del
frontmatter: las columnas y los tiempos se calculan a partir de ahí.
**Etiqueta máximo 20 caracteres, veredicto máximo 16**: la rejilla es
`20ch / 4ch / resto`, y una etiqueta más larga empuja la columna del veredicto
y descuadra todas las filas.

### Está calcada de `senna.social`

Los valores de abajo salieron de medir la referencia con el inspector, no de
gusto. Si tocas uno, deja de parecerse. Están todos comentados en el fichero.

| | Valor |
|---|---|
| Tipografía | **AcPlus** IBM VGA 8x16 |
| Tamaño | 24 px, `line-height: 1.3`, uno solo (16 px por debajo de 700 px) |
| Color | `#dedede` sobre `#060606`. **Monocromo** |
| Aparición | fundido de 0,5 s, cada elemento a su hora |
| Duración | 4,3 s, **con una pausa muerta de 1,1 s** antes de los chequeos |
| Columnas | `min-width` de 20ch / 4ch, flex con `gap` |
| Prompt | parpadeo en vídeo inverso, `steps(1, start)` |

Tres detalles que cuestan de ver y son los que sostienen el parecido:

- **Tiene que ser la variante `AcPlus`** (aspect-corrected), no `Web`/`WebPlus`.
  La 8x16 original se veía en una VGA de 720x400 estirada a una pantalla 4:3,
  o sea con el píxel más alto que ancho. AcPlus lleva ese estirón dentro: el
  avance es 0,4167em (10 px a 24 px) en vez de 0,5em. Con WebPlus las letras
  salen cuadradas y anchas, y eso solo ya rompe el parecido por mucho que
  cuadre todo lo demás.
- **La pausa de 1,1 s no es un descuido.** Es lo que hace que parezca una
  máquina probándose a sí misma en vez de texto apareciendo. Y el último
  chequeo tarda 450 ms más que los otros, como si le costara.
- **Las columnas van en `ch`, no en píxeles.** A 24 px un `ch` de esta fuente
  mide 9,99 px, así que 20ch son los 200 px de la referencia clavados — pero
  además encogen solos cuando el móvil baja la fuente a 16 px.

La fuente es de [VileR](https://int10h.org/oldschool-pc-fonts/), CC BY-SA 4.0.
Vive en `public/fonts/` con su licencia al lado y el crédito que exige está en
el pie del sitio. El `.woff2` se sacó del pack `_win` (los `Ac` no vienen en el
pack web) convirtiendo el TTF con `fonttools`.

Lo que NO se copió es el texto: los chequeos son propios. La maqueta de un POST
es convención de los PC de los 90, pero los chistes concretos de la referencia
son suyos.

Tampoco lleva scanlines ni viñeteado: la referencia no tiene ninguno y es lo
primero que convierte el homenaje en parodia.

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
