# Adc-alt.github.io

Portfolio personal. Es un escritorio de Windows XP: el contenido vive dentro de
ventanas que se arrastran, se minimizan y se cierran.
En vivo: **https://adc-alt.github.io/**

Sitio estático generado con Astro. **Todo el HTML sale del build**, ventanas
incluidas: el JavaScript solo las abre, las mueve y las cierra. Si no se
ejecuta, el sitio se lee igual (ver *Dos modos*). Los dos únicos scripts son la
pantalla de arranque (en línea) y el gestor de ventanas con el reloj de la
bandeja.

## Rutas

El sitio es **una sola página**.

| Ruta | Qué es |
|---|---|
| `/` | El escritorio, con todas las ventanas dentro. **Con pantalla de arranque** la primera visita |
| `/404` | Ventana de error XP |
| `/work/`, `/xp/`, `/proyectos/`, `/perfil/` | Redirecciones a `/` |

Las redirecciones son las rutas de la versión anterior. No son cortesía:
`/work/` es la URL que está en el CV. En salida estática Astro genera para cada
una una página con `meta refresh` — GitHub Pages no sabe hacer un 301.

## Arrancar

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | tests + `astro check` (tipos) + build a `dist/` |
| `pnpm preview` | Sirve `dist/` como lo hará producción |
| `pnpm test` | Solo los tests (`node --test`) |

## Estructura

```
src/
├── consts.ts                 nombre, URL y enlaces sociales
├── content.config.ts         schemas Zod de proyectos y blog
├── content/proyectos/*.md    un fichero = un proyecto = una ventana
├── content/blog/*.md         un fichero = una entrada
├── styles/xp-doc.css         el documento dentro de una ventana
├── layouts/XP.astro          <head>, fondo y barra de tareas
├── components/
│   ├── Boot.astro            la pantalla de arranque
│   └── xp/
│       ├── Window.astro      el marco y el gestor de ventanas
│       ├── windows.mjs       la aritmética de posición (con test)
│       ├── Taskbar.astro     barra de tareas + reloj
│       ├── taskbar-colors.mjs  colores medidos (con test)
│       └── Bienvenida | Proyectos | Proyecto | Perfil | Blog
└── pages/
    ├── index.astro           monta el escritorio y todas las ventanas
    └── 404.astro
```

## Añadir contenido

**Un proyecto:** copia `src/content/proyectos/_plantilla.md`, renómbralo y pon
`draft: false`. Salen solos su ventana y su enlace en el índice; el nombre del
fichero es el `id` de la ventana.

**Una entrada de blog:** un `.md` en `src/content/blog/`. Se ordenan por fecha,
la más reciente arriba.

Los dos frontmatter están validados con Zod en `src/content.config.ts`: si falta
un campo o el `status` no es uno de los tres válidos, **el build falla**.

Los ficheros con `draft: true` se ven en `pnpm dev` pero **no se publican**.

## Dos modos, y el orden importa

Un escritorio no se maneja con el dedo. Por debajo de **720 px** las ventanas
dejan de ser absolutas, se apilan en columna con todas abiertas y scrollea la
página; se esconden los tres botones de la barra de título, y el arrastre se
apaga.

**El modo apilado es la base y el escritorio es la mejora.** Las reglas del
escritorio viven dentro de `@media (min-width: 721px)` y colgando de `html.js`,
una clase que pone un script en línea del `<head>`. Consecuencia buscada: **sin
JavaScript el sitio entero cae en el modo apilado**, en cualquier pantalla, y se
lee. Escrito al revés harían falta dos copias de las mismas reglas y un fallo de
JS dejaría el sitio en blanco.

Si tocas CSS de ventanas, mira en qué bloque estás. `touch-action: none` en la
barra de título es del modo escritorio y **no puede salir de ahí**: en apilado
bloquearía el scroll de la página al arrastrar el título.

## Las ventanas

`src/components/xp/Window.astro` — el marco y el gestor entero. Se abren desde
los enlaces de la ventana de bienvenida, que son `<a href="#id-de-ventana">` de
verdad: con JS el gestor los intercepta, y sin JS son anclas que saltan a la
ventana, que está visible. **No hay iconos de escritorio ni menú Inicio**, así
que la bienvenida es la única navegación del sitio: si se queda sin enlaces, no
se llega a nada.

Cuatro cosas que se rompen solas si no se cuidan:

- **La posición pasa siempre por `clampPosition`** (`windows.mjs`, con test).
  El fallo clásico de un gestor casero es dejar arrastrar hasta que la barra de
  título queda fuera de la pantalla: a partir de ahí no hay forma de
  recuperarla. `KEEP_VISIBLE` son 110px y no 60 porque los tres botones ocupan
  ~70 en el extremo derecho de la barra: con 60, lo que asoma al empujarla a la
  izquierda son solo botones.
- **Cerrar esconde, no destruye.** Con una sola ventana que no se reabría,
  `remove()` valía. Con cinco, una ventana destruida no se puede volver a abrir.
- **La cascada vuelve al principio cada cinco** (`CASCADE_WRAP`). Sin eso, el
  clamp acaba dejando todas las ventanas a partir de la sexta en píxeles
  idénticos, que es peor que no cascadear.
- **La ventana entra 900 ms después de la tecla**, o sea después de la barra
  (400+400). Es una transición sobre el estado visible, no una `@keyframes` con
  retardo: una animación contaría desde que carga la página y la ventana se
  abriría detrás del arranque.

⚠️ **Los colores de la ventana NO están medidos**, a diferencia de los de la
barra de tareas. Son la aproximación pública de Luna que circula por ahí,
puestas a ojo contra el recuerdo. Está avisado en la cabecera del componente.

El blog no tiene URL por entrada: se pintan todas seguidas dentro de su ventana.
Con dos entradas serían dos páginas de un párrafo; el nombre del fichero ya
sirve de slug el día que haga falta.

## Deploy

Push a `main` → GitHub Actions (`.github/workflows/deploy.yml`) hace el build y
publica. Unos 40-60 segundos. No hay que tocar nada a mano.

El origen de Pages es **GitHub Actions**, no «deploy from a branch». `dist/` no
se commitea.

## Accesibilidad

- Todas las animaciones están detrás de `prefers-reduced-motion`.
- Foco visible siempre; nunca `outline: none` sin sustituto.
- Los tres botones de cada ventana son `<button>` con `aria-label`, y
  minimizar/maximizar llevan `aria-pressed`.
- Al abrir una ventana el foco entra en ella; al cerrarla vuelve al enlace que
  la abrió.
- El fondo y los adornos de la barra van con `aria-hidden`.

Los colores de XP **no llegan a AA de texto normal**: blanco sobre el verde del
botón de Inicio da 3,50:1 y sobre el azul de la bandeja 3,39:1, contra los 4,5:1
que pide la norma. Los dos pares sí superan el 3:1 de AA de texto grande, y ese
umbral exige además que el texto sea grande de verdad (≥24px, o ≥18,66px en
negrita):

- **«start» sí cumple AA de texto grande.** Va a 19px en negrita, con sus
  3,50:1.
- **El reloj no cumple.** 14px sin negrita es texto normal, y 3,39:1 se queda
  lejos de 4,5:1.

Es una decisión tomada a sabiendas — bajar los colores hasta cumplir deja de
parecerse a XP — y para el reloj la mitigación es otra: la hora llega íntegra a
un lector de pantalla por el `<time datetime>` pase lo que pase con el
contraste. El test fija el suelo de 3:1 para que no empeore sin que nadie se
entere.

## Pantalla de arranque

`src/components/Boot.astro` + `src/components/boot-data.mjs`. POST de BIOS falso
que tapa el escritorio la primera vez. Se salta con cualquier tecla, clic o
toque.

**Es un homenaje calcado a la pantalla de arranque de
[senna.social](https://senna.social/).** La maqueta, los colores, los tiempos y
el texto son suyos; aquí solo cambia la identidad (el nombre, ADCSOFT y un sello
y un pingüino dibujados aquí en lugar de sus dos imágenes). No se copia ningún
fichero suyo: los dibujos son SVG propios.

Las medidas, con capturas y el porqué de cada número, están en
`docs/superpowers/specs/2026-08-14-arranque-paridad-senna.md`.

Para cambiar el texto o los tiempos, `boot-data.mjs` — pero
**`boot-data.test.mjs` te va a parar**, porque comprueba los valores contra la
tabla de la referencia. Es a propósito: si cambias un número, que sea sabiendo
que dejas de copiarla.

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

Va en el slot `overlay` del layout, fuera de `<main>`. El sitio entero está en
el HTML detrás, así que los buscadores y las tarjetas de previsualización ven el
escritorio y no el arranque.

Todo su JS es `is:inline` y **la pantalla se enseña desde el script**, no se
esconde desde él: si el JS falla, el visitante ve el sitio; al revés vería una
pantalla negra sin salida.

Para volver a verla: borra `boot_seen` de `localStorage`.

Tipografía **AcPlus IBM VGA 8x16** de
[VileR](https://int10h.org/oldschool-pc-fonts/), CC BY-SA 4.0, en `public/fonts/`
con su licencia al lado. **El crédito que exige la licencia está en la ventana de
bienvenida**, que es la que siempre está abierta — vivía en el pie del sitio, que
desapareció con la estética arcade. El `.woff2` se sacó del pack `_win` (los `Ac`
no vienen en el pack web) convirtiendo el TTF con `fonttools`.

## La barra de tareas

Sus colores **están medidos** sobre capturas de XP, píxel a píxel, y la
derivación entera vive en `taskbar-colors.mjs` con test. Las medidas, con
capturas y el porqué de cada número, están en
`docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md`.

Tres cosas que parecen detalles y sostienen lo demás:

- **La barra no es un degradado.** Es un filo claro, un cuerpo casi plano en dos
  tercios del alto, y tres píxeles que oscurecen de golpe al final. Un
  `linear-gradient` de dos colores queda mal. `taskbar-colors.test.mjs` rechaza
  la barra plana, la de dos paradas y la del degradado suave: si tocas los
  colores, la sonda te lo dice.
- **La bandeja del reloj es MÁS clara que la barra, no más oscura.** Lo que la
  hace parecer hundida es el filo oscuro de 1 px de su izquierda. Pintarla más
  oscura es lo que pide el instinto y es lo que la rompe.
- **La barra sube 400 ms después de que el arranque descubra el fondo**, y eso
  es lo que hace que parezca un arranque en vez de una imagen. No lleva
  JavaScript: `Boot.astro` quita `html[data-boot]` al terminar y la barra
  reacciona a que el atributo desaparezca.

## Ficheros que no son míos

**El fondo es Bliss, la foto de Windows XP** (Charles O'Rear, propiedad de
Microsoft). `public/xp/bliss.webp` sale del `bg.jpg` de
[winbows.neocities.org](https://winbows.neocities.org/), reescalado a 2560x1440 y
recodificado a WebP: 1008 KB → 225 KB. **No es una imagen libre**: se usa aquí
como homenaje, igual que hace medio internet, y si algún día molesta se sustituye
borrando ese fichero — el degradado de reserva de `Wallpaper.astro` deja la
página en pie sin él.

**El logotipo del botón de Inicio también es de Microsoft.**
`public/xp/win-flag.png` sale del `win-min.png` de winbows, reducido a 52x48 (se
pinta a 26px de alto, al doble para que no salga borroso en retina). Misma
salvedad que el fondo: es una marca registrada y no una imagen libre.

De la barra en sí, en cambio, no se ha copiado ningún fichero: solo medidas y
colores, que son hechos y no obra.
