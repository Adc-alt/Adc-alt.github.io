# Escritorio XP fase 1 — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** que `/xp/` muestre, después de la pantalla de arranque que ya existe, un escritorio inerte de Windows XP — fondo dibujado y barra de tareas Luna — sin tocar `/` ni `/work/`.

**Architecture:** una página nueva (`src/pages/xp.astro`) sobre un layout nuevo (`src/layouts/XP.astro`) que **no** carga `global.css` ni las fuentes arcade. El escritorio son dos componentes (`Wallpaper.astro`, `Taskbar.astro`) y dos módulos `.mjs` con la única lógica de la fase (los colores medidos de la barra y el formato de la hora), que son lo único con test. El encadenado con el arranque es **CSS puro**: `Boot.astro` ya pone y quita `html[data-boot]`, y la barra se limita a reaccionar a que ese atributo desaparezca.

**Tech Stack:** Astro 7 (salida estática, `build.format` por defecto = directory), Tailwind 4 (que aquí **no** se usa: el escritorio va en CSS plano dentro de `<style>` con ámbito de componente), `node:test` vía `pnpm test`, pnpm 10.

**Spec:** `docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md` — léela entera antes de empezar. Este plan discute contra ella y la cita por sección (§).

**Base:** commit `7e15fd3`.

---

## Global Constraints

Se aplican a **todas** las tareas.

- **Ni un fichero de terceros entra en el repo ni se enlaza.** Ni imágenes, ni fuentes, ni CSS de `winbows.neocities.org` ni de Microsoft. Solo medidas. (§3)
- **Sin logotipo de Windows.** Petición explícita del usuario y la pieza con más carga de marca. (§3, §12)
- **El texto del botón es `start`**, en minúscula y en inglés. No «inicio», no «Adc-alt». (§12)
- **`/` y `/work/` no cambian de comportamiento.** El arranque de la portada sigue usando la llave `boot_seen` y las rutas `/` y `/index.html`. (§5.1)
- **`XP.astro` no importa `src/styles/global.css` ni `@fontsource/*`.** El escritorio tiene su propio sistema. (§5.2)
- **Todo lo animado va detrás de `prefers-reduced-motion: reduce`.** (§8)
- **Los mensajes de commit van en español, sin *trailer* de coautoría y sin línea de «Generated with».** Es política del repo. Después de cada commit: `git log -1 --format='%(trailers)'` tiene que imprimir vacío.
- **Los comentarios y los textos del código van en español**, siguiendo el tono de `Boot.astro`: explican *por qué*, no *qué*.
- **Nada de Tailwind en `src/components/xp/`.** Sin `global.css` no hay clases de Tailwind en esas páginas; una clase de Tailwind ahí no falla, simplemente no hace nada, que es peor.

---

## Estructura de ficheros

| Fichero | Responsabilidad | Tarea |
|---|---|---|
| `src/components/xp/taskbar-colors.mjs` | Los colores medidos de la barra y el degradado que sale de ellos. Módulo suelto porque es lo que se testea. | 1 |
| `src/components/xp/taskbar-colors.test.mjs` | La sonda del perfil, con su control en positivo, y el suelo de contraste. | 1 |
| `src/components/xp/clock.mjs` | `formatTime` y `msToNextMinute`. La única lógica de ejecución de la fase. | 2 |
| `src/components/xp/clock.test.mjs` | Su test. | 2 |
| `src/components/xp/Wallpaper.astro` | El SVG del fondo. Obra propia. | 3 |
| `src/components/xp/Taskbar.astro` | La barra: `start`, hueco de ventanas, bandeja con reloj. Y la animación de entrada. | 4, 7 |
| `src/layouts/XP.astro` | `<head>`, `<body>`, el hueco `overlay` y el montaje de fondo + barra. **Definitivo**, no andamio (§2). | 5 |
| `src/pages/xp.astro` | La ruta. Monta `XP.astro` y le mete `Boot.astro` en el hueco `overlay`. | 5, 6 |
| `astro.config.mjs` | Añadir `/xp/` al filtro del sitemap. | 5 |
| `src/components/Boot.astro` | Dos props nuevas (`paths`, `seenKey`) con valores por defecto que dejan `/` idéntica. | 6 |
| `README.md` | Documentar la ruta y el escritorio. | 8 |

La carpeta `src/components/xp/` existe para que la fase 2 tenga dónde meter el gestor de ventanas sin ensuciar `src/components/` (§5.2).

---

## Desviaciones de la spec que este plan introduce

Tres, todas conscientes. Si no estás de acuerdo con alguna, párate antes de la tarea que la aplica.

1. **§11 pide muestrear píxeles de la barra renderizada; aquí se comprueba el perfil con un test de Node sobre las paradas del degradado.** Un `linear-gradient` con paradas duras está completamente determinado por su lista de paradas: muestrear los píxeles solo comprobaría que el navegador implementa `linear-gradient`. La sonda en positivo que exige §11 se conserva íntegra — el test le pasa a la misma función una barra plana, un degradado de dos paradas y un degradado suave, y las tres tienen que ser rechazadas. Sale ganando: es determinista y corre en `pnpm test` para siempre.
2. **§8 dice que el arranque «no se toca», pero hay que tocarlo.** `Boot.astro` sólo arranca en `/` y `/index.html`, así que en `/xp/` no saldría. El cambio es aditivo: dos props con valores por defecto que dejan la portada byte a byte igual (tarea 6).
3. **Los siete colores del degradado de la barra son *derivados*, no medidos.** Son los multiplicadores por canal de la tira nativa (§4.1) aplicados al cuerpo de la captura de escritorio (§4.2), que es exactamente lo que §4.4 resuelve — «estructura de la tira, color de la captura» — pero convertido en una operación concreta. La derivación va **ejecutable dentro del módulo**, no aplicada a mano, para que nadie la «arregle» sin verla.

## Riesgos conocidos

- **Las dos capturas coinciden en la bandeja y no en la barra.** La columna contaminada de la tira daba `#1290e8` y la bandeja de la captura de escritorio da `#1290e9`: un valor de 255 de diferencia, o sea que las dos capturas *sí* concuerdan en la bandeja. Pero discrepan de largo en el cuerpo (`#3980f4` contra `#245edc`). La explicación más probable es que sean dos variantes de Luna (Service Pack, DPI o esquema de color distintos). No se reabre la spec: se implementa lo que §4.4 decidió. Queda anotado porque si la barra acaba pareciendo «el azul equivocado», este es el hilo del que tirar.
- **El radio del botón `start` (8 px) y el brillo del borde superior del botón no están medidos.** §7 ya lo señala para el radio. Los dos se confirman contra una captura nativa en la tarea 8; hasta entonces van con un comentario que lo dice en el propio CSS.
- **El glob del `pnpm test`** ya está comprobado y **sí** llega a `src/components/xp/`: probado con un fichero de sonda en Node v24.15.0, aparece en la salida. Aun así, cada tarea que añade un test **cuenta los tests en la salida de `pnpm test`**, porque un test que no corre es un falso verde perfecto y el conteo cuesta cero. Punto de partida: **19 tests** en el commit `7e15fd3`.

---

## Task 1: Los colores medidos de la barra

**Files:**
- Create: `src/components/xp/taskbar-colors.mjs`
- Test: `src/components/xp/taskbar-colors.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `BODY: number[]` — `[36, 94, 220]`
  - `START_BODY: number[]`, `START_EDGE: number[]`, `TRAY_BODY: number[]`, `TRAY_FOOT: number[]`, `TRAY_EDGE: number[]`
  - `hex(rgb: number[]): string`
  - `tint(row: number, body?: number[]): number[]`
  - `STOPS: {px: number, rgb: number[]}[]`
  - `gradient(stops?): string` — un `linear-gradient(...)` listo para CSS
  - `checkProfile(stops): string[]` — array de fallos; vacío = la barra tiene la forma de §4.1
  - `contrastWithWhite(rgb: number[]): number` — ratio WCAG contra blanco

- [ ] **Step 1: Escribir el test, que falla**

Crear `src/components/xp/taskbar-colors.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BODY,
  START_BODY,
  TRAY_BODY,
  STOPS,
  hex,
  tint,
  gradient,
  checkProfile,
  contrastWithWhite,
} from "./taskbar-colors.mjs";

test("el cuerpo es el azul de la captura de escritorio", () => {
  assert.equal(hex(BODY), "#245edc");
});

test("las filas de la tira se retinen sobre el cuerpo de la captura", () => {
  // Calculados aplicando el multiplicador por canal de cada fila de la tira
  // (§4.1) al cuerpo de la captura (§4.2). Si cambias BODY, cambian todos.
  assert.equal(hex(tint(1)), "#2767d1");
  assert.equal(hex(tint(3)), "#2c68db");
  assert.equal(hex(tint(4)), "#2d66de");
  assert.equal(hex(tint(21)), "#1c49c3");
  assert.equal(hex(tint(22)), "#153bae");
  assert.equal(hex(tint(23)), "#103198");
});

test("una fila que no esta en la tira es cuerpo", () => {
  assert.deepEqual(tint(12), BODY);
});

test("nuestra barra tiene el perfil de §4.1", () => {
  assert.deepEqual(checkProfile(STOPS), []);
});

// ── Control en positivo ────────────────────────────────────────────────────
// Una sonda que solo aprueba lo nuestro no comprueba nada. Estas tres son las
// formas equivocadas de pintar la barra, y la sonda tiene que rechazar las tres.

test("la sonda rechaza una barra plana", () => {
  const plana = [
    { px: 0, rgb: BODY },
    { px: 30, rgb: BODY },
  ];
  assert.ok(checkProfile(plana).length > 0, "una barra plana deberia fallar");
});

test("la sonda rechaza un degradado de dos paradas", () => {
  const dos = [
    { px: 0, rgb: tint(4) },
    { px: 30, rgb: tint(23) },
  ];
  assert.ok(checkProfile(dos).length > 0, "dos paradas deberian fallar");
});

test("la sonda rechaza un degradado suave de arriba abajo", () => {
  // El fallo que §4.1 avisa expresamente: parece bien y no lo esta, porque el
  // cuerpo de XP es plano y aqui va cambiando en todo el alto.
  const suave = [
    { px: 0, rgb: tint(1) },
    { px: 3, rgb: tint(4) },
    { px: 15, rgb: BODY },
    { px: 26, rgb: tint(21) },
    { px: 27, rgb: tint(22) },
    { px: 28, rgb: tint(23) },
    { px: 30, rgb: tint(23) },
  ];
  assert.ok(checkProfile(suave).length > 0, "el cuerpo no esta plano y deberia fallar");
});

test("la sonda rechaza una sombra que no oscurece en orden", () => {
  const desordenada = STOPS.map((s) =>
    s.px === 27 ? { px: 27, rgb: tint(4) } : s,
  );
  assert.ok(checkProfile(desordenada).length > 0, "la sombra al reves deberia fallar");
});

// ── Contraste ──────────────────────────────────────────────────────────────

test("el degradado sale como CSS con paradas en pixeles", () => {
  const css = gradient();
  assert.match(css, /^linear-gradient\(to bottom,/);
  assert.ok(css.includes("#245edc 6px"), css);
  assert.ok(css.includes("#103198 30px"), css);
});

test("el blanco sobre verde y sobre bandeja cumple AA grande", () => {
  // §10.1: NO cumplen AA de texto normal (4.5:1) y es una decision tomada y
  // documentada. Lo que este test bloquea es que bajen del suelo que si
  // cumplen: 3:1, AA de texto grande. Si tocas los colores y esto se pone
  // rojo, has empeorado la accesibilidad sin darte cuenta.
  const verde = contrastWithWhite(START_BODY);
  const bandeja = contrastWithWhite(TRAY_BODY);
  assert.ok(verde >= 3, `blanco sobre verde: ${verde.toFixed(2)}:1`);
  assert.ok(bandeja >= 3, `blanco sobre bandeja: ${bandeja.toFixed(2)}:1`);
  // Los valores de §10.1, fijados para que un cambio se note.
  assert.equal(verde.toFixed(2), "3.50");
  assert.equal(bandeja.toFixed(2), "3.39");
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm test
```

Esperado: FALLA con `Cannot find module` apuntando a `./taskbar-colors.mjs`.

**Además**, comprobar en la salida que el fichero nuevo aparece listado. El glob ya está verificado (ver «Riesgos conocidos»), así que si aquí *no* aparece es que el fichero está mal colocado, no que el glob falle.

- [ ] **Step 3: Escribir el módulo**

Crear `src/components/xp/taskbar-colors.mjs`:

```js
/**
 * Los colores de la barra de tareas de Luna.
 *
 * Medidos, no elegidos. El porqué de cada número está en
 * docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md §4.
 *
 * Lo que hay que saber para no romperlo: hay DOS capturas de referencia y sus
 * azules NO coinciden. La spec (§4.4) resuelve que el COLOR lo manda la captura
 * de escritorio y la ESTRUCTURA la manda la tira nativa. Por eso las filas de la
 * tira se guardan como MULTIPLICADOR por canal respecto al cuerpo de su propia
 * captura, y no como color absoluto: así la forma sobrevive al cambio de azul y
 * la derivación queda a la vista en vez de aplicada a mano.
 */

/** Cuerpo de la barra. Captura de escritorio 640x480, §4.2. #245edc */
export const BODY = [36, 94, 220];

/** Botón de Inicio, §4.2. Cuerpo #259e25, borde #1d861d. */
export const START_BODY = [37, 158, 37];
export const START_EDGE = [29, 134, 29];

/** Bandeja del sistema, §4.3. Es MÁS CLARA que la barra, no más oscura. */
export const TRAY_BODY = [18, 144, 233]; // #1290e9
export const TRAY_FOOT = [15, 110, 209]; // #0f6ed1  ultima fila
export const TRAY_EDGE = [55, 112, 168]; // #3770a8  el filo que la hunde

/** Cuerpo de la tira nativa 800x24, columna vacía x=390, §4.1. #3980f4 */
const STRIP_BODY = [57, 128, 244];

/**
 * Fila de la tira → RGB. Las filas 5-20 son el cuerpo y por eso no están.
 *
 * §4.1 llama a la fila 4 «punto más claro»: lo es por canal azul, pero por
 * luminancia la más clara es la 3. Da igual, y el orden se conserva al
 * retenir — pero por eso `checkProfile` comprueba «la banda alta gana al
 * cuerpo» y no «la fila 4 es el máximo».
 */
const STRIP_ROWS = {
  1: [62, 140, 232], // #3e8ce8  primer filo claro
  3: [69, 142, 243], // #458ef3  banda alta
  4: [71, 139, 246], // #478bf6  punto mas claro
  21: [45, 100, 216], // #2d64d8  empieza a oscurecer
  22: [33, 81, 193], // #2151c1
  23: [26, 67, 169], // #1a43a9  filo inferior
};

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

export const hex = (rgb) =>
  "#" + rgb.map((c) => clamp(c).toString(16).padStart(2, "0")).join("");

/** El color de una fila de la tira, reteñido sobre `body`. */
export function tint(row, body = BODY) {
  const src = STRIP_ROWS[row];
  if (!src) return body.slice();
  return src.map((c, i) => (c / STRIP_BODY[i]) * body[i]);
}

/**
 * Paradas del degradado para una barra de 30 px.
 *
 * Reparto: la tira tiene 23 filas útiles — 4 de filo claro, 16 de cuerpo, 3 de
 * sombra (17 % / 70 % / 13 %). A 30 px salen 5 / 21 / 4.
 *
 * Las paradas van en PÍXELES y no en porcentajes: la barra tiene alto fijo, y
 * así el filo de 1 px mide 1 px de verdad en cualquier pantalla. Las paradas
 * repetidas (26, 27, 28) son cortes duros a propósito: en XP esas tres filas
 * oscurecen de golpe, no en rampa.
 */
export const STOPS = [
  { px: 0, rgb: tint(1) },
  { px: 1, rgb: tint(1) },
  { px: 1, rgb: tint(3) },
  { px: 3, rgb: tint(4) },
  { px: 6, rgb: BODY },
  { px: 26, rgb: BODY },
  { px: 26, rgb: tint(21) },
  { px: 27, rgb: tint(21) },
  { px: 27, rgb: tint(22) },
  { px: 28, rgb: tint(22) },
  { px: 28, rgb: tint(23) },
  { px: 30, rgb: tint(23) },
];

export const gradient = (stops = STOPS) =>
  "linear-gradient(to bottom," +
  stops.map((s) => `${hex(s.rgb)} ${s.px}px`).join(",") +
  ")";

/** Luminancia relativa WCAG. */
function luminance([r, g, b]) {
  const lin = (c) => {
    const s = clamp(c) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Ratio de contraste WCAG contra blanco puro. */
export const contrastWithWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05);

/**
 * Sonda del perfil. Devuelve la lista de fallos; vacía significa que la barra
 * tiene la forma de §4.1.
 *
 * Existe para poder FALLAR: el test le pasa una barra plana, un degradado de
 * dos paradas y uno suave, y tiene que rechazar los tres. Una sonda que solo
 * aprueba lo nuestro no comprueba nada.
 */
export function checkProfile(stops) {
  // La última parada en un píxel dado es el color que rige a partir de ahí.
  const at = (px) => {
    const hit = stops.filter((s) => s.px === px);
    return hit.length ? hit[hit.length - 1].rgb : null;
  };
  const body = luminance(BODY);
  const errs = [];

  const alto = at(3);
  if (!alto) errs.push("no hay banda alta en 3px");
  else if (luminance(alto) <= body) errs.push("la banda alta no es mas clara que el cuerpo");

  if (stops.some((s) => s.px > 6 && s.px < 26)) {
    errs.push("el cuerpo no esta plano entre 6px y 26px");
  }

  const sombra = [at(26), at(27), at(28)];
  if (sombra.some((c) => !c)) {
    errs.push("faltan las tres filas oscuras del final");
  } else {
    if (luminance(sombra[0]) >= body) {
      errs.push("la sombra no empieza mas oscura que el cuerpo");
    }
    for (let i = 1; i < sombra.length; i++) {
      if (luminance(sombra[i]) >= luminance(sombra[i - 1])) {
        errs.push(`la fila ${26 + i} no oscurece respecto a la anterior`);
      }
    }
  }
  return errs;
}
```

- [ ] **Step 4: Correr los tests y verlos pasar**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm test
```

Esperado: PASS. `taskbar-colors.test.mjs` con **10 tests**, y los de `boot-data` y `comecocos-maze` siguen verdes. Total de la suite: **29** (los 19 que había + 10).

Comprobación de cordura: `gradient()` tiene que dar exactamente esto —

```
linear-gradient(to bottom,#2767d1 0px,#2767d1 1px,#2c68db 1px,#2d66de 3px,#245edc 6px,#245edc 26px,#1c49c3 26px,#1c49c3 27px,#153bae 27px,#153bae 28px,#103198 28px,#103198 30px)
```

Si `contrastWithWhite` no da exactamente `3.50` y `3.39`, **no toques el `assert` para que cuadre**: revisa `START_BODY` y `TRAY_BODY` contra §4.2 y §4.3. Esos dos números son los de la spec y son la razón de que exista §10.1.

- [ ] **Step 5: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/xp/taskbar-colors.mjs src/components/xp/taskbar-colors.test.mjs
git commit -m "Colores medidos de la barra XP, con sonda de perfil y control en positivo"
git log -1 --format='%(trailers)'   # tiene que imprimir vacio
```

---

## Task 2: El reloj

**Files:**
- Create: `src/components/xp/clock.mjs`
- Test: `src/components/xp/clock.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `formatTime(date: Date): string` — `"HH:MM"`, 24 h, hora **local**
  - `msToNextMinute(date: Date): number` — milisegundos hasta el próximo minuto en punto

- [ ] **Step 1: Escribir el test, que falla**

Crear `src/components/xp/clock.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTime, msToNextMinute } from "./clock.mjs";

// Fechas en hora LOCAL a propósito: la bandeja enseña la hora del visitante,
// no UTC. Con `new Date(y, m, d, ...)` el test no depende de la TZ de quien lo
// corra, porque construye y lee por el mismo lado.
const at = (h, m, s = 0, ms = 0) => new Date(2026, 0, 15, h, m, s, ms);

test("rellena con cero a la izquierda", () => {
  assert.equal(formatTime(at(9, 5)), "09:05");
  assert.equal(formatTime(at(0, 7)), "00:07");
});

test("va en 24h, no en 12h ni con am/pm", () => {
  assert.equal(formatTime(at(0, 0)), "00:00");
  assert.equal(formatTime(at(12, 0)), "12:00");
  assert.equal(formatTime(at(13, 0)), "13:00");
  assert.equal(formatTime(at(23, 59)), "23:59");
});

test("msToNextMinute llega justo al minuto en punto", () => {
  assert.equal(msToNextMinute(at(10, 30, 59, 500)), 500);
  assert.equal(msToNextMinute(at(10, 30, 30, 0)), 30000);
});

test("en el segundo cero espera un minuto entero, no cero", () => {
  // Si devolviera 0, el setTimeout se dispararia en bucle sin parar.
  assert.equal(msToNextMinute(at(10, 30, 0, 0)), 60000);
});
```

- [ ] **Step 2: Correrlo y ver que falla**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm test
```

Esperado: FALLA con `Cannot find module` apuntando a `./clock.mjs`.

- [ ] **Step 3: Escribir el módulo**

Crear `src/components/xp/clock.mjs`:

```js
/**
 * La hora de la bandeja del sistema.
 *
 * Módulo suelto y no cuatro líneas dentro del componente porque es la única
 * lógica de ejecución de la fase (§9), y el relleno con cero es justo donde
 * vive el fallo que se ve una vez al día a las 9:05.
 */

/** `HH:MM` en 24 h, hora local del navegador. */
export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Milisegundos hasta el próximo minuto en punto.
 *
 * El reloj se reprograma con esto en vez de latir cada segundo: la bandeja solo
 * enseña minutos, así que despertar sesenta veces por minuto para pintar lo
 * mismo es gastar batería por nada. En el segundo cero devuelve 60000 y no 0,
 * que dejaría el `setTimeout` girando en vacío.
 */
export function msToNextMinute(date) {
  return 60000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}
```

- [ ] **Step 4: Correr los tests y verlos pasar**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm test
```

Esperado: PASS. `clock.test.mjs` con **4 tests**. Total de la suite: **33** (19 + 10 + 4).

- [ ] **Step 5: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/xp/clock.mjs src/components/xp/clock.test.mjs
git commit -m "Reloj de la bandeja: formato 24h y despertar al minuto en punto"
git log -1 --format='%(trailers)'
```

---

## Task 3: El fondo

**Files:**
- Create: `src/components/xp/Wallpaper.astro`

**Interfaces:**
- Consumes: nada.
- Produces: un componente sin props que pinta un `<svg class="xp-wallpaper">` en `position: fixed; inset: 0` con `z-index: 0`.

No lleva test: es un dibujo, y un test de un dibujo comprueba que el dibujo es el dibujo. Se valida mirándolo, en la tarea 5.

- [ ] **Step 1: Escribir el componente**

Crear `src/components/xp/Wallpaper.astro`:

```astro
---
/**
 * El fondo del escritorio.
 *
 * DIBUJADO AQUÍ. El fondo de Windows XP es una fotografía con dueño y no se
 * copia ni se enlaza (§3 de la spec); esto lo evoca, no lo reproduce. Tampoco
 * se descarga el bg.jpg de winbows.
 *
 * Va en línea y no como fichero: sin petición HTTP y sin el destello de fondo
 * liso mientras carga la imagen, que es justo lo que rompería la escena que
 * empieza en la pantalla de arranque.
 */
---

<svg
  class="xp-wallpaper"
  viewBox="0 0 1600 1000"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <linearGradient id="xp-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1e5fa8"></stop>
      <stop offset="0.45" stop-color="#4b9ada"></stop>
      <stop offset="0.78" stop-color="#a8d6f0"></stop>
    </linearGradient>
    <linearGradient id="xp-hill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8dc63f"></stop>
      <stop offset="1" stop-color="#4f8f1f"></stop>
    </linearGradient>
  </defs>

  <rect width="1600" height="1000" fill="url(#xp-sky)"></rect>

  {/* Nubes: elipses solapadas y sin filtro. Un feGaussianBlur a pantalla
      completa cuesta caro en un portátil y no se nota sobre un cielo así. */}
  <g fill="#ffffff" opacity="0.85">
    <ellipse cx="300" cy="230" rx="150" ry="42"></ellipse>
    <ellipse cx="380" cy="205" rx="95" ry="52"></ellipse>
    <ellipse cx="235" cy="215" rx="80" ry="38"></ellipse>
  </g>
  <g fill="#ffffff" opacity="0.6">
    <ellipse cx="1180" cy="330" rx="185" ry="38"></ellipse>
    <ellipse cx="1250" cy="308" rx="105" ry="45"></ellipse>
  </g>

  {/* La colina: UNA curva ancha. Con dos lomas simétricas deja de parecer un
      paisaje y empieza a parecer un logotipo. */}
  <path
    d="M0 1000 L0 720 C 260 640, 520 600, 860 660 C 1140 710, 1380 700, 1600 640 L1600 1000 Z"
    fill="url(#xp-hill)"></path>

  {/* Cresta más clara donde le da el sol. */}
  <path
    d="M0 720 C 260 640, 520 600, 860 660 C 1140 710, 1380 700, 1600 640 L1600 672 C 1380 732, 1140 742, 860 692 C 520 632, 260 672, 0 752 Z"
    fill="#a5d84a"
    opacity="0.55"></path>
</svg>

<style>
  .xp-wallpaper {
    position: fixed;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    /* `slice` en el preserveAspectRatio hace que recorte en vez de deformar,
       como un fondo de pantalla de verdad (§6). */
    z-index: 0;
  }
</style>
```

- [ ] **Step 2: Comprobar que compila**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm check
```

Esperado: `0 errors`. (Todavía no lo usa nadie, así que esto solo verifica que el `.astro` es válido.)

- [ ] **Step 3: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/xp/Wallpaper.astro
git commit -m "Fondo del escritorio en SVG dibujado, sin la fotografia de Microsoft"
git log -1 --format='%(trailers)'
```

---

## Task 4: La barra de tareas

**Files:**
- Create: `src/components/xp/Taskbar.astro`

**Interfaces:**
- Consumes: `gradient`, `hex`, `START_BODY`, `START_EDGE`, `TRAY_BODY`, `TRAY_FOOT`, `TRAY_EDGE` de `./taskbar-colors.mjs`; `formatTime`, `msToNextMinute` de `./clock.mjs`.
- Produces: un componente sin props que pinta `<div class="xp-taskbar">` fijo abajo, 30 px de alto, `z-index: 10`.

La animación de entrada **no** va en esta tarea: es la tarea 7.

- [ ] **Step 1: Escribir el componente**

Crear `src/components/xp/Taskbar.astro`:

```astro
---
/**
 * La barra de tareas de Windows XP, tema Luna.
 *
 * Los colores NO son decisiones de aquí: están medidos sobre capturas y la
 * derivación entera vive en ./taskbar-colors.mjs, con test. Si algo aquí te
 * parece un color raro, míralo ahí antes de cambiarlo.
 *
 *   Medidas y razones → docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md §4, §7
 *
 * El degradado se inyecta por `style` en vez de escribirlo en el <style>
 * porque un bloque de CSS no puede leer el módulo: así el CSS y el test miran
 * exactamente la misma lista de paradas.
 */
import {
  gradient,
  hex,
  START_BODY,
  START_EDGE,
  TRAY_BODY,
  TRAY_FOOT,
  TRAY_EDGE,
} from "./taskbar-colors.mjs";

const bar = gradient();
const startBg = `linear-gradient(to bottom, ${hex(START_BODY)} 0, ${hex(START_BODY)} 70%, ${hex(START_EDGE)} 100%)`;
const startBgDown = `linear-gradient(to bottom, ${hex(START_EDGE)} 0, ${hex(START_EDGE)} 45%, ${hex(START_BODY)} 100%)`;
const trayBg = `linear-gradient(to bottom, ${hex(TRAY_BODY)} 0, ${hex(TRAY_BODY)} 90%, ${hex(TRAY_FOOT)} 100%)`;
const trayEdge = hex(TRAY_EDGE);
---

<div
  class="xp-taskbar"
  style={`--bar:${bar};--start-bg:${startBg};--start-down:${startBgDown};--tray-bg:${trayBg};--tray-edge:${trayEdge}`}
>
  {/* Es un <button> de verdad y no un <div>: enfocable con teclado y anunciado
      por un lector de pantalla. En fase 1 se hunde y no abre nada. */}
  <button class="xp-start" type="button">start</button>

  {/* Zona de ventanas. Vacía en fase 1 y sin dibujar: existe solo para empujar
      la bandeja contra el borde derecho. La fase 2 mete aquí los botones. */}
  <div class="xp-tasks"></div>

  <div class="xp-tray">
    {/* Sin `datetime` en el HTML del build: el reloj es la hora del VISITANTE,
        no la del servidor de compilación. Lo pone el script al arrancar. */}
    <time class="xp-clock" id="xp-clock"></time>
  </div>
</div>

<script>
  import { formatTime, msToNextMinute } from "./clock.mjs";

  const el = document.getElementById("xp-clock");
  if (el) {
    const tick = () => {
      const now = new Date();
      el.textContent = formatTime(now);
      // El texto va en local y el `datetime` en ISO/UTC: los dos nombran el
      // mismo instante, y así un lector de pantalla lo recibe exacto sin
      // depender de que se lea el contraste de la bandeja (§10.1).
      el.setAttribute("datetime", now.toISOString());
      setTimeout(tick, msToNextMinute(now));
    };
    tick();
  }
</script>

<style>
  .xp-taskbar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    /* 30px: 14-15 filas en una captura reducida 2:1, y el valor por defecto de
       XP a 96 ppp (§4.2). */
    height: 30px;
    z-index: 10;
    display: flex;
    align-items: stretch;
    background: var(--bar);
    /* Tahoma es la de XP. No se envía ninguna fuente: si el visitante no la
       tiene, cae en la que más se le parezca de las suyas. */
    font-family: Tahoma, "DejaVu Sans", Verdana, sans-serif;
    /* Un escritorio no se selecciona con el ratón. */
    user-select: none;
  }

  /* ── El botón de Inicio ──────────────────────────────────────────────────
     94x28 medidos (§4.2). 28 sobre 30 deja 1px de barra arriba y otro abajo.

     ⚠️ DOS cosas de aquí NO están medidas y hay que confirmarlas contra una
     captura nativa (§7):
       - el radio de 8px: a escala 1:2 los píxeles de la esquina se mezclan con
         el azul y el detector de verde los descarta, así que lo medido (2-4px)
         se queda corto;
       - el brillo del borde de arriba: el botón real de XP tiene una banda
         clara en la primera fila que esta captura no resuelve, así que aquí
         solo van los dos verdes que SÍ están medidos.
     Son los únicos números a ojo de toda la barra. Están juntos y señalados a
     propósito: en el trabajo de la pantalla de arranque, el único color puesto
     a ojo fue justo el que la revisión tumbó. */
  .xp-start {
    flex: none;
    align-self: center;
    width: 94px;
    height: 28px;
    margin: 0;
    padding: 0 0 2px 12px;
    border: 0;
    border-radius: 0 8px 8px 0;
    background: var(--start-bg);
    color: #ffffff;
    font: italic bold 15px/1 Tahoma, "DejaVu Sans", Verdana, sans-serif;
    text-align: left;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.45);
    /* Cursor de flecha, no de mano: en Windows los botones no cambian el
       puntero. */
    cursor: default;
  }
  .xp-start:active {
    /* Se hunde invirtiendo el degradado y bajando el texto un píxel. No hace
       nada más: el menú Inicio es de la fase 2. */
    background: var(--start-down);
    padding-top: 2px;
    padding-bottom: 0;
  }
  .xp-start:focus-visible {
    /* Hacia dentro: un outline hacia fuera se sale de la barra por abajo. */
    outline: 2px solid #ffffff;
    outline-offset: -4px;
  }

  .xp-tasks {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* ── La bandeja ──────────────────────────────────────────────────────────
     100px medidos (§4.3). Lo que la hace parecer hundida es el FILO oscuro de
     la izquierda, no el relleno: el relleno es MÁS CLARO que la barra y más
     cian. Si la pintas más oscura, que es lo que pide el instinto, se rompe. */
  .xp-tray {
    flex: none;
    width: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid var(--tray-edge);
    background: var(--tray-bg);
    color: #ffffff;
    font-size: 11px;
  }
  .xp-clock {
    /* Sin JS la bandeja queda vacía, y es aceptable: es adorno, no contenido
       (§9). */
    letter-spacing: 0.02em;
  }
</style>
```

- [ ] **Step 2: Comprobar que compila**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm check
```

Esperado: `0 errors`.

Si `astro check` se queja de que `el` puede ser `null`, el `if (el)` ya lo cubre; si se queja de otra cosa dentro del `<script>`, arréglalo ahí y no lo silencies con `any`.

- [ ] **Step 3: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/xp/Taskbar.astro
git commit -m "Barra de tareas Luna: start, hueco de ventanas y bandeja con reloj"
git log -1 --format='%(trailers)'
```

---

## Task 5: El layout y la ruta `/xp/`

**Files:**
- Create: `src/layouts/XP.astro`
- Create: `src/pages/xp.astro`
- Modify: `astro.config.mjs:11`

**Interfaces:**
- Consumes: `Wallpaper.astro`, `Taskbar.astro`, `SITE` de `../consts`.
- Produces: `XP.astro` con `Props { title?: string; description?: string }`, un `<slot name="overlay" />` como primer hijo del `<body>` y un `<slot />` dentro de `<main id="contenido">`.

Al terminar esta tarea `/xp/` ya se ve. Todavía **sin** pantalla de arranque (tarea 6) y **sin** la animación de entrada (tarea 7).

- [ ] **Step 1: Escribir el layout**

Crear `src/layouts/XP.astro`:

```astro
---
/**
 * El escritorio.
 *
 * Layout DEFINITIVO, no andamio (§2 de la spec): el portfolio acabará viviendo
 * en ventanas XP dentro de este mismo `<main>`, y la estética arcade actual
 * desaparecerá. Por eso aquí NO se importa global.css ni ninguna @fontsource:
 * el escritorio tiene su propio sistema y no debe arrastrar el del sitio viejo.
 * Consecuencia práctica: en estas páginas no hay clases de Tailwind. Una clase
 * de Tailwind aquí no da error, simplemente no hace nada.
 */
import Wallpaper from "../components/xp/Wallpaper.astro";
import Taskbar from "../components/xp/Taskbar.astro";
import { SITE } from "../consts";

interface Props {
  title?: string;
  description?: string;
}

const { title = "Escritorio", description = SITE.tagline } = Astro.props;
const fullTitle = `${title} — ${SITE.name}`;
---

<!doctype html>
<html lang={SITE.locale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    {/* En obras: no debe competir en Google con el sitio real, igual que
        /work/ (§5.1). También está fuera del sitemap, en astro.config.mjs. */}
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href={SITE.url + "/"} />
    <meta name="generator" content={Astro.generator} />
    <meta name="theme-color" content="#245edc" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>

  <body>
    {/* Hueco a pantalla completa (la pantalla de arranque), primer hijo del
        <body> igual que en Base.astro. Aquí el orden importa por una razón de
        más: el script antipestañeo del arranque vive dentro de este hueco y
        tiene que poner html[data-boot] ANTES de que se parsee la barra, o la
        barra asoma un fotograma antes de esconderse (ver tarea 7). */}
    <slot name="overlay" />

    {/* id="contenido" no es decorativo: al terminar, el arranque busca ese id
        para devolverle el foco al teclado. Sin él, el foco se queda en el
        <body> después de saltarse la pantalla. */}
    <main id="contenido" class="xp-desktop">
      <Wallpaper />
      <slot />
    </main>

    <Taskbar />
  </body>
</html>

<style is:global>
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
  }
  body {
    /* Reserva sólida por si el SVG del fondo no llega a pintar (§6). Es el tono
       medio del cielo, así que un fallo se ve como un cielo liso y no como una
       pantalla blanca. */
    background: #4b9ada;
    /* Un escritorio no tiene scroll. */
    overflow: hidden;
  }
  .xp-desktop {
    position: relative;
    height: 100dvh;
  }
</style>
```

- [ ] **Step 2: Escribir la página**

Crear `src/pages/xp.astro`:

```astro
---
/**
 * El escritorio de Windows XP.
 *
 * Fase 1: fondo y barra, y nada más. Sin iconos, sin menú Inicio y sin
 * ventanas — eso es la fase 2.
 *
 * Vive en /xp/ y no en / a propósito (§5.1): un escritorio sin ventanas es un
 * callejón sin salida, y la portada es la herramienta de búsqueda de trabajo.
 * La raíz pasa a ser esto el día que existan las ventanas.
 *
 * Spec: docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md
 */
import XP from "../layouts/XP.astro";
---

<XP />
```

- [ ] **Step 3: Sacar `/xp/` del sitemap**

En `astro.config.mjs`, reemplazar el bloque de `integrations` (líneas 8-11):

```js
  // /work/ y /xp/ no deben competir en Google con la portada: /work/ es la
  // misma portada sin pantalla de arranque, y /xp/ es el escritorio en obras.
  // Los dos llevan además `noindex` y canonical a la raíz.
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/work/") && !page.endsWith("/xp/"),
    }),
  ],
```

- [ ] **Step 4: Construir y comprobar la salida**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm build
```

Esperado: `pnpm test` verde, `astro check` con `0 errors`, y el build genera `dist/xp/index.html`.

Después, comprobar el HTML generado sin abrir el navegador:

```bash
cd /home/adelg/Adc-alt.github.io
test -f dist/xp/index.html && echo "existe"
grep -q 'linear-gradient(to bottom,#2767d1 0px' dist/xp/index.html && echo "degradado ok" || echo "MAL: el degradado no es el del modulo"
grep -q 'noindex' dist/xp/index.html && echo "noindex ok"
grep -q '/xp/' dist/sitemap-0.xml && echo "MAL: /xp/ esta en el sitemap" || echo "fuera del sitemap ok"
grep -q 'press-start-2p\|jetbrains-mono' dist/xp/index.html && echo "MAL: arrastra las fuentes arcade" || echo "sin fuentes arcade ok"
```

Esperado: `existe`, `degradado ok`, `noindex ok`, `fuera del sitemap ok`, `sin fuentes arcade ok`.

(`compressHTML` está activado por defecto en Astro, así que el HTML sale en pocas líneas. Por eso los `grep` van con `-q` y no con `-c`: el conteo de líneas no significa nada aquí.)

- [ ] **Step 5: Mirarlo en el navegador**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm dev
```

Chromium de Linux está roto en esta máquina: se conduce el Chrome de Windows.

```bash
powershell.exe -Command "Start-Process chrome.exe 'http://localhost:4321/xp/'"
```

Comprobar a ojo:
- El fondo llena la ventana y **recorta** al cambiar de proporción, no se deforma.
- La barra está pegada abajo, ocupa todo el ancho y mide 30 px (DevTools → seleccionar `.xp-taskbar` → pestaña Computed).
- El botón `start` mide 94x28 y al mantener pulsado se hunde.
- La bandeja es **más clara** que la barra y tiene un filo oscuro a su izquierda.
- El reloj marca la hora correcta y **no** parpadea cada segundo.

Parar el servidor y comprobar que el puerto queda libre:

```bash
# Ctrl-C en la terminal del dev, y luego:
ss -ltnp 2>/dev/null | grep -q ':4321 ' && echo "MAL: 4321 sigue ocupado" || echo "4321 libre"
```

- [ ] **Step 6: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/layouts/XP.astro src/pages/xp.astro astro.config.mjs
git commit -m "Ruta /xp/ con el escritorio: layout propio, noindex y fuera del sitemap"
git log -1 --format='%(trailers)'
```

---

## Task 6: Encadenar la pantalla de arranque

**Files:**
- Modify: `src/components/Boot.astro:22-24` (el bloque `import` del frontmatter)
- Modify: `src/components/Boot.astro:27-43` (el script antipestañeo)
- Modify: `src/components/Boot.astro:47` (el `<div id="boot">`)
- Modify: `src/components/Boot.astro:261-265` (la escritura de `boot_seen`)
- Modify: `src/pages/xp.astro`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `Boot.astro` con `Props { paths?: string[]; seenKey?: string }`. Valores por defecto `["/", "/index.html"]` y `"boot_seen"`, que dejan `/` exactamente como está.

**Por qué hacen falta dos props y no una.** `paths` es obligatoria: sin ella el arranque no sale en `/xp/` y no hay escena que enseñar. `seenKey` también: quien ya haya visto el arranque de la portada tiene `boot_seen` puesto, y con una sola llave `/xp/` se saltaría el arranque justo para el visitante al que se le quiere enseñar **el paso** del arranque al escritorio, que es el objeto entero de la fase. Cuando el escritorio se mude a `/`, se borran las dos props y vuelve a haber una sola llave.

- [ ] **Step 1: Añadir las props al frontmatter de `Boot.astro`**

Reemplazar el bloque `import` del frontmatter (líneas 22-24, **sin tocar el `---` de la 25**) por:

```astro
import {
  HEAD, LOADING, SPECS, COUNT, DEVICES, TAIL, PROMPT, T, AUTO_MS,
} from "./boot-data.mjs";

interface Props {
  /**
   * Rutas donde puede salir. Por defecto solo la raíz, que tiene dos
   * direcciones porque GitHub Pages sirve la misma página en "/" y en
   * "/index.html".
   */
  paths?: string[];
  /**
   * Llave de localStorage del «ya lo vi». Una por ruta que arranque: si dos
   * rutas comparten llave, la segunda no arranca nunca para quien ya vio la
   * primera.
   */
  seenKey?: string;
}

const { paths = ["/", "/index.html"], seenKey = "boot_seen" } = Astro.props;
```

- [ ] **Step 2: Que el script antipestañeo lea las props**

Reemplazar el script 1 entero (líneas 27-43) por:

```astro
{/* 1. Antipestañeo. Va antes del marcado a propósito: decide si la pantalla
      llega a existir, así el visitante que repite no ve ni un frame. */}
<script is:inline define:vars={{ paths, seenKey }}>
  (function () {
    // `define:vars` es la única forma de que un script inline vea el
    // frontmatter, y aquí no hay alternativa: este script corre ANTES del
    // marcado, así que no puede leer el dato de un data-* del DOM como hace
    // el script 2. Astro lo serializa como `const` delante del IIFE.
    if (paths.indexOf(location.pathname) === -1) return;
    try {
      if (localStorage.getItem(seenKey)) return;
    } catch (e) {
      /* modo privado: que arranque igual */
    }
    document.documentElement.setAttribute("data-boot", "on");
  })();
</script>
```

Si `astro check` o el build avisan de que `is:inline` y `define:vars` no se llevan bien, quita el `is:inline`: `define:vars` ya implica inline por sí solo.

- [ ] **Step 3: Que el script 2 escriba la misma llave**

El script 2 es `is:inline` **sin** `define:vars` y no ve el frontmatter, así que la llave viaja por el DOM como ya hacen `data-auto` y los `data-d`.

En el marcado, línea 47, añadir el atributo:

```astro
<div id="boot" data-auto={AUTO_MS} data-seen-key={seenKey}>
```

Y en el script 2, reemplazar el bloque del `localStorage.setItem` (líneas 261-265) por:

```js
      try {
        // Del DOM y no del frontmatter: este script no lleva `define:vars`.
        localStorage.setItem(el.getAttribute("data-seen-key") || "boot_seen", "1");
      } catch (e) {
        /* modo privado */
      }
```

- [ ] **Step 4: Montar el arranque en `/xp/`**

Reemplazar el bloque final de `src/pages/xp.astro` (el `<XP />` suelto) por:

```astro
import XP from "../layouts/XP.astro";
import Boot from "../components/Boot.astro";
---

<XP>
  {/* Llave propia: quien ya vio el arranque de la portada tiene que ver éste
      igual, porque lo que se enseña aquí es justo el paso del arranque al
      escritorio. Cuando esto se mude a /, se quitan las dos props. */}
  <Boot
    slot="overlay"
    paths={["/xp/", "/xp", "/xp/index.html"]}
    seenKey="boot_seen_xp"
  />
</XP>
```

Las tres rutas: `/xp/` es la que sirve GitHub Pages, `/xp/index.html` la directa, y `/xp` la que da `astro dev` cuando escribes la URL sin barra.

- [ ] **Step 5: Construir y comprobar que `/` no ha cambiado de llave ni de rutas**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm build
```

Esperado: `0 errors`, build correcto.

```bash
cd /home/adelg/Adc-alt.github.io
grep -o 'boot_seen[a-z_]*' dist/index.html | sort -u      # esperado: solo boot_seen
grep -o 'boot_seen[a-z_]*' dist/xp/index.html | sort -u    # esperado: solo boot_seen_xp
grep -o '"/xp[^"]*"' dist/index.html | sort -u             # esperado: NADA
```

Si `dist/index.html` menciona `boot_seen_xp` o `/xp`, la portada se ha contaminado: párate y arréglalo antes de commitear.

- [ ] **Step 6: Probar las dos rutas en el navegador**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm dev
```

```bash
powershell.exe -Command "Start-Process chrome.exe 'http://localhost:4321/'"
```

En la consola de DevTools, `localStorage.clear()` y recargar. Comprobar en este orden:

1. **`/`** — el arranque sale igual que siempre y al saltárselo aparece la portada arcade. `localStorage.boot_seen === "1"` y `localStorage.boot_seen_xp === undefined`.
2. **`/` otra vez** — no sale el arranque. Sigue siendo el comportamiento de antes.
3. **`/work/`** — no sale el arranque, pase lo que pase. Es la URL del CV.
4. **`/xp/`** — el arranque **sí** sale, aunque `boot_seen` esté puesto de los pasos 1-2. Al saltárselo, el tubo se apaga y detrás queda el escritorio.
5. **`/xp/` otra vez** — ya no sale. `localStorage.boot_seen_xp === "1"`.
6. **`/proyectos/`** — no sale el arranque.

Parar el servidor y comprobar el puerto como en la tarea 5.

- [ ] **Step 7: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/Boot.astro src/pages/xp.astro
git commit -m "El arranque tambien en /xp/, con rutas y llave de 'ya lo vi' por prop"
git log -1 --format='%(trailers)'
```

---

## Task 7: La entrada — la barra sube después del fondo

**Files:**
- Modify: `src/components/xp/Taskbar.astro` (solo el bloque `<style>`)

**Interfaces:** ninguna nueva. Es CSS.

**Cómo funciona, porque no es obvio.** No hay JavaScript. `Boot.astro` ya pone `html[data-boot="on"]` mientras la pantalla se ve, lo cambia a `"off"` mientras el tubo se apaga, y lo **quita** en `fin()` cuando la pantalla desaparece del DOM. La barra solo tiene que reaccionar a que el atributo desaparezca. La transición se declara en el estado **visible**, no en el escondido: el navegador lee la `transition` del estado de destino, así que al quitarse el atributo la barra anima, y mientras el atributo está puesto no anima nada.

- [ ] **Step 1: Añadir el bloque al `<style>` de `Taskbar.astro`**

Al final del `<style>`, después de la regla `.xp-clock`:

```css
  /* ── La entrada ──────────────────────────────────────────────────────────
     Sin JavaScript. El arranque pone html[data-boot] mientras se ve y lo QUITA
     al terminar (Boot.astro, fin()): la barra solo reacciona a que desaparezca.

     La transición se declara en el estado VISIBLE y no en el escondido a
     propósito: el navegador lee la `transition` del estado de destino, así que
     al quitarse el atributo la barra anima, y mientras está puesto no anima.

     Los 400 ms de retardo son lo que vende la escena (§8): si la barra sube a
     la vez que aparece el fondo, parece una imagen; si sube después, parece un
     arranque. */
  .xp-taskbar {
    transform: translateY(0);
    transition: transform 400ms cubic-bezier(0.16, 1, 0.3, 1) 400ms;
  }
  :global(html[data-boot]) .xp-taskbar {
    transform: translateY(100%);
    /* Sin transición mientras el arranque está puesto: si no, la barra bajaría
       deslizándose en la primera pintura en vez de estar ya escondida. */
    transition: none;
  }

  /* Sin movimiento: la barra ya está puesta cuando el arranque se va. Con la
     preferencia activada el arranque además termina de golpe, sin apagado de
     tubo, así que las dos cosas casan. */
  @media (prefers-reduced-motion: reduce) {
    .xp-taskbar {
      transition: none;
    }
  }
```

- [ ] **Step 2: Comprobar la secuencia en el navegador**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm dev
powershell.exe -Command "Start-Process chrome.exe 'http://localhost:4321/xp/'"
```

En DevTools: `localStorage.removeItem("boot_seen_xp")` y recargar. La secuencia tiene que ser:

1. Arranque POST sobre negro.
2. Cualquier tecla → el tubo se apaga (300 ms) y detrás aparece el fondo, **con la barra todavía fuera de la pantalla**.
3. Pausa. El fondo se ve solo.
4. La barra sube deslizándose desde abajo.

Si la barra ya está puesta cuando aparece el fondo, el `:global(html[data-boot])` no está haciendo efecto: mira que el `<slot name="overlay" />` sea el **primer** hijo del `<body>` en `XP.astro`.

- [ ] **Step 3: Comprobar `prefers-reduced-motion`**

En DevTools → Rendering → *Emulate CSS media feature prefers-reduced-motion* → `reduce`. Recargar con `localStorage.removeItem("boot_seen_xp")`.

Esperado: el arranque aparece de golpe y sin parpadeo, al saltárselo desaparece sin apagado de tubo, y el fondo y la barra están **ya colocados**. Ningún deslizamiento.

Parar el servidor y comprobar el puerto.

- [ ] **Step 4: Commit**

```bash
cd /home/adelg/Adc-alt.github.io
git add src/components/xp/Taskbar.astro
git commit -m "La barra sube 400ms despues de que el arranque descubra el fondo"
git log -1 --format='%(trailers)'
```

---

## Task 8: Verificación de §11 y documentación

**Files:**
- Modify: `README.md:15-21` (tabla de rutas y el párrafo de `/work/`)
- Modify: `README.md:156` (sección nueva antes de «Easter egg»)
- Posiblemente: `src/components/xp/Taskbar.astro` (los dos números a ojo, si la captura nativa dice otra cosa)

Esta tarea recorre la tabla de §11 entera. No es papeleo: dos de las casillas son las que en el trabajo de la pantalla de arranque destaparon fallos reales.

- [ ] **Step 1: Confirmar los dos números a ojo del botón `start`**

Los dos que el CSS marca con ⚠️: el radio de 8 px y el brillo del borde de arriba.

Buscar una captura de Windows XP a resolución nativa (1024x768 o más) donde se vea el botón de Inicio completo, ampliarla y comparar con lo que pinta el navegador al 100 %. Si el radio real es claramente distinto de 8 px, corregirlo en `.xp-start` y quitar la parte del ⚠️ que ya no aplique.

**La captura no se guarda en el repo ni se commitea.** Sale al directorio de scratch, se mira, y se borra — igual que las de la fase de medición.

Si no aparece una captura suficientemente buena, **dejarlo en 8 px y dejar el ⚠️ puesto**, y decirlo en el informe. Lo que no vale es quitar el aviso sin haber mirado.

- [ ] **Step 2: Recorrer la tabla de §11**

```bash
cd /home/adelg/Adc-alt.github.io && pnpm build
```

| Casilla de §11 | Comando / gesto | Esperado |
|---|---|---|
| Formato de la hora | `pnpm test` | `clock.test.mjs`, 4 tests verdes |
| Perfil de la barra | `pnpm test` | `taskbar-colors.test.mjs`, 10 verdes, **incluidos los cuatro de rechazo** |
| Alto y botón | DevTools → Computed sobre `.xp-taskbar` y `.xp-start` | `30px` y `94x28` |
| Contraste | `pnpm test` | el test de AA grande pasa y fija 3.50 y 3.39 |
| Sin ficheros ajenos | ver abajo | sin coincidencias, 0 imágenes |
| Movimiento reducido | ya hecho en la tarea 7, paso 3 | sin deslizamiento |
| El sitio sigue vivo | ver abajo | `/` y `/work/` idénticas |

Ficheros ajenos:

```bash
cd /home/adelg/Adc-alt.github.io
grep -rn 'neocities\|winbows\|bg\.jpg' src/ public/ astro.config.mjs || echo "sin referencias ajenas"
git diff --stat 7e15fd3..HEAD -- '*.png' '*.jpg' '*.jpeg' '*.gif' '*.webp' '*.ico' | tail -1
```

Esperado: `sin referencias ajenas`, y el segundo comando **sin salida** (ninguna imagen añadida desde la spec).

El sitio sigue vivo — que la portada y el CV renderizan igual y que nada de `/xp/` se ha colado:

```bash
cd /home/adelg/Adc-alt.github.io
grep -c 'boot_seen' dist/index.html                        # >= 1
grep -o 'boot_seen[a-z_]*' dist/index.html | sort -u        # solo boot_seen
grep -o 'boot_seen[a-z_]*' dist/work/index.html | sort -u   # NADA: /work/ no arranca
grep -q 'xp-taskbar' dist/index.html && echo "MAL: la barra se ha colado en la portada" || echo "portada limpia"
grep -q 'xp-taskbar' dist/work/index.html && echo "MAL: la barra se ha colado en /work/" || echo "/work/ limpia"
```

Y una pasada a ojo por `/`, `/work/`, `/proyectos/` y `/perfil/` en el navegador: la portada arcade sigue exactamente igual.

**Riesgo residual, y hay que decirlo en el informe:** esto comprueba que la portada no se ha contaminado, pero no compara byte a byte contra el build anterior. El cambio de la tarea 6 toca `Boot.astro`, que es compartido, así que la pasada manual por `/` **no es opcional**.

- [ ] **Step 3: Documentar en el README**

En la tabla de rutas, después de la fila de `/proyectos/` (línea 17), añadir:

```markdown
| `/xp/` | **Escritorio de Windows XP.** En obras: fondo y barra, sin ventanas |
```

Y debajo del párrafo de `/work/` (líneas 19-21), añadir:

```markdown
`/xp/` lleva `noindex` y está fuera del sitemap por lo mismo: es una fase
intermedia y no debe aparecer en Google todavía.
```

Al final del fichero, antes de `## Easter egg`:

```markdown
## Escritorio XP

`/xp/` es un mock de Windows XP: el fondo de pantalla y la barra de tareas del
tema Luna, y nada más. Sin iconos, sin menú Inicio y sin ventanas.

Existe porque el plan es que **el escritorio acabe sustituyendo al sitio**: el
portfolio pasará a vivir dentro de ventanas XP y la estética arcade
desaparecerá. `src/layouts/XP.astro` es el layout definitivo de eso, no un
andamio, y por eso no importa `global.css` ni las fuentes arcade. En esas
páginas no hay Tailwind.

Vive en `/xp/` y no en `/` porque un escritorio sin ventanas es un callejón sin
salida y la portada es la URL que va en el CV. La raíz se muda el día que
existan las ventanas.

**No hay ni un byte de Microsoft ni de winbows.neocities.org.** El fondo está
dibujado aquí en SVG, y de la barra solo se han copiado medidas y colores, que
son hechos y no obra. No hay logotipo de Windows.

Las medidas, con capturas y el porqué de cada número, están en
`docs/superpowers/specs/2026-08-15-escritorio-xp-fase1-design.md`.

Tres cosas que parecen detalles y sostienen lo demás:

- **La barra no es un degradado.** Es un filo claro, un cuerpo casi plano en
  siete octavos del alto, y tres píxeles que oscurecen de golpe al final. Un
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

Los colores de XP **no llegan a AA de texto normal**: blanco sobre el verde del
botón da 3,50:1 y sobre el azul de la bandeja 3,39:1, contra los 4,5:1 que pide
la norma. Los dos sí cumplen AA de texto grande (3:1). Es una decisión tomada a
sabiendas — bajarlos hasta cumplir deja de parecerse a XP — y la hora llega
íntegra a un lector de pantalla por el `<time datetime>` pase lo que pase. El
test fija el suelo de 3:1 para que no empeore sin que nadie se entere.

Para volver a ver el arranque del escritorio: borra `boot_seen_xp` de
`localStorage`. Es una llave distinta de la de la portada a propósito.
```

- [ ] **Step 4: Comprobación final y commit**

```bash
cd /home/adelg/Adc-alt.github.io
pnpm build && git status --short
```

Esperado: build verde y sin ficheros sin seguir que no toque commitear.

```bash
cd /home/adelg/Adc-alt.github.io
git add README.md src/components/xp/Taskbar.astro
git commit -m "Documentar el escritorio XP y cerrar la verificacion de la fase 1"
git log -1 --format='%(trailers)'
git log --oneline 7e15fd3..HEAD
```

Esperado: ocho commits (uno por tarea) desde la spec, ninguno con *trailers*.

- [ ] **Step 5: Informe**

Decirle al usuario, sin recortar:

- Qué casillas de §11 pasaron y **cuáles no**, con el resultado real.
- Si el radio de 8 px se confirmó contra una captura nativa o se quedó a ojo.
- Que `/` sigue en `boot_seen` y `/xp/` en `boot_seen_xp`, y que eso significa que **el visitante ve dos arranques**, uno por ruta, hasta que el escritorio se mude a la raíz.
- Que sigue pendiente decidir el móvil, y que hoy `/xp/` en un móvil se ve como un escritorio de 94 px de botón en 390 px de ancho: no está roto, pero tampoco está pensado.
- Que **no se ha desplegado**: el push a `main` lo decide el usuario.

---

## Fuera de alcance

No lo hagas en este plan aunque te tiente (§13):

- Ventanas, iconos del escritorio, menú Inicio, botones de ventana en la barra.
- Diseño para móvil.
- Mover el escritorio a `/` o retirar la estética arcade.
- Desplegar. `git push` a `main` publica en 40-60 s y eso lo decide el usuario.
