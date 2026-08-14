# Pantalla de arranque con paridad 100% — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la pantalla de arranque del portfolio sea la misma que la de `senna.social`: mismo texto en inglés, misma maqueta, mismos tiempos y misma forma de aparecer, cambiando solo la identidad (nombre, ADCSOFT, pingüino).

**Architecture:** Se parte el componente en dos. `src/components/boot-data.mjs` es JavaScript plano con el contenido y la tabla de tiempos; lo importan tanto el frontmatter de Astro como un test de `node:test`, así que los números de la referencia quedan bloqueados por el `pnpm test` que corre antes de cada build. `src/components/Boot.astro` se queda solo con el marcado, el CSS y el script inline. El CSS se copia literal de `bootstyle.css` de la referencia, traduciendo los `px` de columna a `ch` (equivalencia exacta a 24 px, y además encoge en el móvil).

**Tech Stack:** Astro 7 (salida estática), CSS con ámbito de componente, `is:inline` para el script, `node:test` para los tests, AcPlus IBM VGA 8x16 (ya instalada).

**Spec:** `docs/superpowers/specs/2026-08-14-arranque-paridad-senna.md`

## Global Constraints

Valores tomados de la referencia. Copiar **exactos**; cualquier desvío rompe el parecido.

- Tipografía: **`AcPlus IBM VGA 8x16`** (aspect-corrected). Ni `Web437` ni `WebPlus`. Ya está en `public/fonts/AcPlus_IBM_VGA_8x16.woff2`.
- Tamaño `24px`, `line-height: 1.3`. Un `ch` mide **9,99 px**.
- Colores: fondo `#060606`, texto `#dedede`, contenedor `#b3b3b3`. **Nada más.** Ni cian, ni lima, ni ámbar, ni magenta.
- Columnas: `20ch` la etiqueta, `4ch` los puntos (centrados), `2ch` de hueco (`5ch` en el bloque de specs), `-2ch` la unidad. Posiciones resultantes: **20 / 240 / 300**, y **270 / 340** en el bloque de specs.
- La aparición es **seca** y llega **500 ms después** del retardo nominal. Ver el spec §5.
- Tabla de retardos: 1000 / 1200 / 1400 / 1600 / 1600 / 1700 / 1800 / 1800 / 1900 / **3000** / 3050 / 3100 / 3200 / 3250 / **3700** / 3800 / 3900 / 4000.
- Prompt: parpadeo en **vídeo inverso**, `1s steps(1, start) infinite`.
- **No entra sola.** `AUTO_MS = 0`.
- **Sin efectos de CRT** en la pantalla (scanlines, viñeteado, curvatura). Lo único permitido es el apagado de 300 ms al salir.
- Todo el texto **en inglés**. Ni una tilde, ni una `ñ`, ni la palabra `comecocos` en ningún sitio del componente.
- El texto que no es identidad va **literal**: `Micro-D1-NK`, `Memory Testing: WHAT?`, `Dastardly drawings`, `Keyboard & Mouse`, `CRT Monitors`, `LAN Funny Man [22]`, `lego-island-two.pcm`, `[PRESS ANY KEY TO CONTINUE]`.
- Se cambia solo: `Senna's Social Network` → `Adc-alt's Portfolio`; `SENNASOFT` → `ADCSOFT`; `2025` → `2026`; `SEN:` → `ADC:`; el logo y el icono, que son dibujos suyos, por SVG propios.
- **No se copia ningún fichero** de senna.social (ni imágenes, ni CSS, ni JS). Los dibujos son propios.

---

### Task 1: El contenido y la tabla de tiempos, con test

Saca del componente todo lo que es dato para poder comprobarlo con `node:test`. Los números de la referencia dejan de ser una nota en un comentario y pasan a ser una aserción que rompe el build si alguien los toca.

**Files:**
- Create: `src/components/boot-data.mjs`
- Test: `src/components/boot-data.test.mjs`

**Interfaces:**
- Consumes: nada.
- Produces: exportaciones con nombre que consume la Task 2 —
  `HEAD: {title: string, copy: string, mark: string}`,
  `LOADING: string`,
  `SPECS: Array<{k: string, v: string, unit?: string, count?: boolean}>`,
  `COUNT: {numbers: number[], intervals: number[]}`,
  `DEVICES: Array<{k: string, s: string}>`,
  `TAIL: {k: string, v: string}`,
  `PROMPT: string`,
  `T: {title, copy, loading, icon, logo, count, tailKey, tailValue, prompt: number, spec: number[], name: number[], verdict: number[]}`,
  `AUTO_MS: number`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/components/boot-data.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  HEAD, LOADING, SPECS, COUNT, DEVICES, TAIL, PROMPT, T, AUTO_MS,
} from "./boot-data.mjs";

/**
 * La tabla de retardos de la referencia, copiada tal cual de su textloader.js.
 * Si un test de aquí se pone rojo es que alguien ha tocado un tiempo: o lo
 * devuelve a su sitio, o cambia esta tabla a sabiendas de que ya no es igual.
 */
const REF = {
  1: 1000, 2: 1600, 3: 1800, 4: 1200, 5: 1400, 6: 1600,
  7: 1700, 8: 1800, 9: 1900, 10: 3000, 11: 3050, 12: 3100,
  13: 3200, 14: 3250, 15: 3700, 16: 3800, 17: 3900, 18: 4000,
};

test("los tiempos son los de la referencia", () => {
  assert.equal(T.title, REF[1]);
  assert.equal(T.icon, REF[2]);
  assert.equal(T.logo, REF[3]);
  assert.equal(T.copy, REF[4]);
  assert.equal(T.loading, REF[5]);
  assert.deepEqual(T.spec, [REF[6], REF[7], REF[8]]);
  assert.equal(T.count, REF[9]);
  assert.deepEqual(T.name, [REF[10], REF[11], REF[12]]);
  assert.deepEqual(T.verdict, [REF[13], REF[14], REF[15]]);
  assert.equal(T.tailKey, REF[16]);
  assert.equal(T.tailValue, REF[17]);
  assert.equal(T.prompt, REF[18]);
});

test("la pausa antes de los chequeos dura 1,1 s", () => {
  // Es lo que hace que parezca una maquina probandose a si misma.
  assert.equal(T.name[0] - T.count, 1100);
});

test("el ultimo veredicto se hace de rogar 450 ms", () => {
  assert.equal(T.verdict.at(-1) - T.verdict.at(-2), 450);
  assert.equal(T.verdict[1] - T.verdict[0], 50);
});

test("hay un tiempo por cada linea", () => {
  assert.equal(T.spec.length, SPECS.length);
  assert.equal(T.name.length, DEVICES.length);
  assert.equal(T.verdict.length, DEVICES.length);
});

test("el prompt es lo ultimo que sale", () => {
  const todos = [
    T.title, T.copy, T.loading, T.icon, T.logo, T.count,
    T.tailKey, T.tailValue, ...T.spec, ...T.name, ...T.verdict,
  ];
  assert.equal(Math.max(...todos, T.prompt), T.prompt);
});

test("no entra sola", () => {
  assert.equal(AUTO_MS, 0);
});

test("la escalera del contador acaba en el valor que se ensena", () => {
  const fila = SPECS.find((s) => s.count);
  assert.ok(fila, "tiene que haber una fila con contador");
  assert.equal(String(COUNT.numbers.at(-1)), fila.v);
});

test("hay un intervalo por cada peldano del contador", () => {
  assert.equal(COUNT.intervals.length, COUNT.numbers.length);
});

test("las etiquetas caben en la columna de 20ch", () => {
  // Una etiqueta mas larga empuja la columna del veredicto y descuadra la
  // rejilla entera, que es justo lo que no se puede tocar.
  for (const s of SPECS) assert.ok(s.k.length <= 20, `spec larga: ${s.k}`);
  for (const d of DEVICES) assert.ok(d.k.length <= 20, `chequeo largo: ${d.k}`);
});

test("todo en ingles: ni tildes, ni enes, ni signos de apertura", () => {
  const texto = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  const malo = texto.match(/[áéíóúüñÁÉÍÓÚÜÑ¿¡]/g);
  assert.equal(malo, null, `caracteres en espanol: ${malo}`);
});

test("no queda rastro del comecocos", () => {
  const texto = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  assert.ok(!/comecocos/i.test(texto));
});

test("la identidad es la de este portfolio y no la de la referencia", () => {
  const texto = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  assert.ok(/Adc-alt/.test(HEAD.title));
  assert.ok(/ADCSOFT/.test(HEAD.copy));
  assert.ok(!/senna/i.test(texto), "quedan restos del nombre de la referencia");
  assert.ok(!/SENNASOFT/i.test(texto));
});
```

- [ ] **Step 2: Correr el test y comprobar que falla**

Run: `pnpm test`
Expected: FAIL con `Cannot find module '.../src/components/boot-data.mjs'`.

- [ ] **Step 3: Escribir `src/components/boot-data.mjs`**

```js
/**
 * Contenido y tiempos de la pantalla de arranque.
 *
 * Está calcado de la primera página de https://senna.social/. Los tiempos y
 * las frases NO son decisiones de diseño de aquí: son valores copiados. Están
 * en este fichero, y no dentro del .astro, para que `boot-data.test.mjs` pueda
 * comprobarlos contra la tabla de la referencia en cada build.
 *
 * Medidas y razones: docs/superpowers/specs/2026-08-14-arranque-paridad-senna.md
 *
 * ⚠️ Antes de tocar nada de aquí, lee el spec. Cada número tiene un porqué y
 * el test te va a parar.
 */

/** Lo único que cambia respecto a la referencia: quién es el dueño. */
export const HEAD = {
  title: "Adc-alt's Portfolio [Version 95.0.218y2k3]",
  copy: "Copyright (c) 2026 ADCSOFT Corporation.",
  mark: "ADC:LAN FUNNY MAN",
};

export const LOADING = "Loading...";

/**
 * Bloque de arriba. Los dos puntos van dentro de la etiqueta y con espaciado
 * distinto en cada línea: en la referencia parece tecleado a mano, y así se
 * queda.
 */
export const SPECS = [
  { k: "PROCESSOR MODEL :", v: "Micro-D1-NK" },
  { k: "Memory Testing:", v: "WHAT?" },
  { k: "Dastardly drawings :", v: "91021", unit: "KB", count: true },
];

/**
 * El contador de memoria. Despacio al principio (275 ms), disparado en medio
 * (30 ms) y frenando al final (50 ms). Dura unos 830 ms.
 * `intervals[i]` es lo que se espera DESPUÉS de pintar `numbers[i]`.
 */
export const COUNT = {
  numbers: [24, 25, 507, 1337, 5678, 9001, 12345, 42069, 80085, 91021],
  intervals: [275, 30, 30, 30, 30, 30, 30, 50, 50, 50],
};

/** Bloque de chequeos: dispositivo, puntos y veredicto. */
export const DEVICES = [
  { k: "Keyboard & Mouse", s: "CONNECTED" },
  { k: "CRT Monitors", s: "PITCHING & WHINING" },
  { k: "LAN Funny Man [22]", s: "ONLINE" },
];

export const TAIL = { k: "CD-ROM inserted :", v: "lego-island-two.pcm" };

export const PROMPT = "[PRESS ANY KEY TO CONTINUE]";

/**
 * Retardos en ms desde que carga la página, copiados de su `textloader.js`.
 *
 * ⚠️ Lo que se ve en pantalla llega 500 ms MÁS TARDE que estos números. No es
 * un error de esta tabla: es el `transition: visibility 0s .5s` del CSS, que
 * mantiene la línea escondida mientras la opacidad sube. Spec §5.
 *
 * Los dos silencios son la mitad del carácter de la pantalla:
 *  - 1,1 s enteros entre `count` (1900) y `name[0]` (3000).
 *  - 450 ms de más en el último veredicto (3250 → 3700).
 */
export const T = {
  title: 1000,
  copy: 1200,
  loading: 1400,
  icon: 1600,
  logo: 1800,
  spec: [1600, 1700, 1800],
  count: 1900,
  name: [3000, 3050, 3100],
  verdict: [3200, 3250, 3700],
  tailKey: 3800,
  tailValue: 3900,
  prompt: 4000,
};

/**
 * Milisegundos hasta entrar solo al portfolio. **0 = no entra sola, espera.**
 * La referencia sigue en el arranque a los 25 s si no tocas nada. Verificado.
 */
export const AUTO_MS = 0;
```

- [ ] **Step 4: Correr el test y comprobar que pasa**

Run: `pnpm test`
Expected: PASS. Los 7 tests del laberinto del comecocos siguen verdes y se suman los 11 nuevos.

- [ ] **Step 5: Commit**

```bash
git add src/components/boot-data.mjs src/components/boot-data.test.mjs
git commit -m "Saca el contenido del arranque a un modulo con test de paridad"
```

---

### Task 2: Reescribir `Boot.astro` con la maqueta y el CSS de la referencia

Todo el componente. El marcado sigue el orden del HTML de la referencia y el CSS es el suyo traducido a `ch`.

**Files:**
- Modify: `src/components/Boot.astro` (se reemplaza entero)

**Interfaces:**
- Consumes: todas las exportaciones de `boot-data.mjs` de la Task 1.
- Produces: nada que importe nadie. El componente ya se usa en `src/pages/index.astro` con `<Boot slot="overlay" />`; **no hay que tocar esa página ni `Base.astro`**.

- [ ] **Step 1: Reemplazar el fichero entero**

Escribir `src/components/Boot.astro` con esto, tal cual:

````astro
---
/**
 * Pantalla de arranque tipo POST de BIOS. Cortina, no laberinto.
 *
 * Calcada de la primera página de https://senna.social/. Las medidas, los
 * colores y los tiempos NO son decisiones de aquí: están medidos sobre la
 * referencia con el inspector. Si tocas uno, deja de parecerse.
 *
 *   Medidas, razones y capturas → docs/superpowers/specs/2026-08-14-arranque-paridad-senna.md
 *   Texto y tiempos             → ./boot-data.mjs (con test que los bloquea)
 *
 * Cómo se comporta, por si hay que depurarlo:
 *  - Solo se monta en `/` y en `/index.html`. `/work/` (la URL del currículum)
 *    y los enlaces profundos pintan el portfolio sin pasar por aquí.
 *  - Todo el JS es `is:inline` y síncrono. Si el navegador no ejecuta JS, el
 *    overlay se queda en `display:none` y el portfolio funciona igual. Por eso
 *    se ENSEÑA desde el script en vez de esconderse desde el script: al revés,
 *    un fallo de JS dejaría el sitio tapado con una pantalla negra.
 *  - El primer script va ANTES del marcado: así el que ya lo vio no ve ni un
 *    parpadeo de la pantalla de arranque.
 */
import {
  HEAD, LOADING, SPECS, COUNT, DEVICES, TAIL, PROMPT, T, AUTO_MS,
} from "./boot-data.mjs";
---

{/* 1. Antipestañeo. Va antes del marcado a propósito: decide si la pantalla
      llega a existir, así el visitante que repite no ve ni un frame. */}
<script is:inline>
  (function () {
    // La raiz tiene dos direcciones: GitHub Pages sirve la misma pagina en "/"
    // y en "/index.html", y comparando solo con "/" el arranque no salia por
    // la segunda. Cualquier otra ruta (enlaces profundos, /work/) no arranca.
    var p = location.pathname;
    if (p !== "/" && p !== "/index.html") return;
    try {
      if (localStorage.getItem("boot_seen")) return;
    } catch (e) {
      /* modo privado: que arranque igual */
    }
    document.documentElement.setAttribute("data-boot", "on");
  })();
</script>

{/* `data-*` es el puente al script inline: un `is:inline` no ve las variables
    del frontmatter, así que el dato viaja por el DOM. */}
<div id="boot" data-auto={AUTO_MS}>
  <div class="boot-inner">
    <div class="boot-screen">
      {/* El aria-hidden va aquí y NO en el envoltorio: si envuelve también al
          botón, el overlay se convierte en una trampa sin salida para un lector
          de pantalla, y un aria-hidden="false" en el hijo no lo rescata. */}
      <div class="boot-text" aria-hidden="true">
        <div class="boot-container">
          {/* Sello de conformidad, en el hueco donde los PC de la época ponían
              la pegatina de Energy Star. 42x58 como el de la referencia, pero
              dibujado aquí: el suyo es un PNG suyo y no se copia. */}
          <svg
            class="boot-icon r"
            data-d={T.icon}
            viewBox="0 0 21 29"
            width="42"
            height="58"
            role="presentation"
          >
            <circle cx="10.5" cy="9.5" r="8" fill="none" stroke="#d94f3d" stroke-width="2"></circle>
            <circle cx="10.5" cy="9.5" r="4.5" fill="none" stroke="#d94f3d" stroke-width="1.4"></circle>
            <path d="M5.5 16.5 L3.5 28 L10.5 24 L17.5 28 L15.5 16.5 Z" fill="#d94f3d"></path>
          </svg>

          <div class="text-container">
            <span class="r" data-d={T.title}>{HEAD.title}</span>
            <span class="r" data-d={T.copy}>{HEAD.copy}</span>
          </div>

          <div class="boot-logo r" data-d={T.logo}>
            {/* Pingüino en píxeles, rejilla de celdas de 4 (12x15 celdas). El
                cuerpo va en gris azulado y no en negro: sobre fondo negro un
                pingüino negro no se ve. La panza no llega ni a los bordes ni al
                cuello, que si no pierde la silueta y parece un robot. */}
            <svg viewBox="0 0 48 60" width="132" height="165" role="presentation">
              <g fill="#99a1bd">
                <rect x="16" y="0" width="16" height="4"></rect>
                <rect x="8" y="4" width="32" height="4"></rect>
                <rect x="4" y="8" width="40" height="12"></rect>
                <rect x="8" y="20" width="32" height="4"></rect>
                <rect x="0" y="24" width="48" height="16"></rect>
                <rect x="8" y="40" width="32" height="12"></rect>
                <rect x="12" y="52" width="24" height="4"></rect>
              </g>
              <rect x="16" y="26" width="16" height="26" fill="#e8ebf5"></rect>
              <g fill="#e8ebf5">
                <rect x="12" y="10" width="6" height="6"></rect>
                <rect x="30" y="10" width="6" height="6"></rect>
              </g>
              <g fill="#0d0f16">
                <rect x="14" y="12" width="3" height="3"></rect>
                <rect x="32" y="12" width="3" height="3"></rect>
              </g>
              <g fill="#ffc53d">
                <rect x="20" y="16" width="8" height="6"></rect>
                <rect x="8" y="56" width="12" height="4"></rect>
                <rect x="28" y="56" width="12" height="4"></rect>
              </g>
            </svg>
            <span class="boot-mark">{HEAD.mark}</span>
          </div>
        </div>

        <div class="boot-gap"></div>

        <span class="r" data-d={T.loading}>{LOADING}</span>

        <div class="boot-gap"></div>

        {
          SPECS.map((s, i) => (
            <div class="aligned-section aligned-section--wide">
              <span class="r" data-d={T.spec[i]}>{s.k}</span>
              {s.count ? (
                <>
                  <span
                    class="r number"
                    data-d={T.count}
                    data-numbers={COUNT.numbers.join(",")}
                    data-intervals={COUNT.intervals.join(",")}
                  >
                    {s.v}
                  </span>
                  <span class="r unit" data-d={T.spec[i]}>{s.unit}</span>
                </>
              ) : (
                <span class="r" data-d={T.spec[i]}>{s.v}</span>
              )}
            </div>
          ))
        }

        <div class="boot-gap"></div>

        {
          DEVICES.map((d, i) => (
            <div class="aligned-section">
              <span class="r" data-d={T.name[i]}>{d.k}</span>
              <span class="r" data-d={T.name[i]}>...</span>
              <span class="r" data-d={T.verdict[i]}>{d.s}</span>
            </div>
          ))
        }

        <div class="boot-gap"></div>

        {/* El espacio va en duro (\u00a0): uno normal al principio de un
            inline-block se colapsa y quedaría "inserted :lego-island-two.pcm". */}
        <span class="r" data-d={T.tailKey}>{TAIL.k}</span><span
          class="r"
          data-d={T.tailValue}>{"\u00a0" + TAIL.v}</span
        >
      </div>

      {/* La referencia usa un <span> aquí. Un <span> no se puede tabular y un
          lector de pantalla no lo anuncia, así que el overlay no tendría salida
          sin ratón. El texto es idéntico; solo cambia la etiqueta. */}
      <button id="boot-enter" class="r blinking" type="button" data-d={T.prompt}>
        {PROMPT}
      </button>
    </div>
  </div>
</div>

{/* 2. Comportamiento. Inline y síncrono, sin imports: el mismo script que
      enseña la pantalla es el que sabe quitarla. */}
<script is:inline>
  (function () {
    var el = document.getElementById("boot");
    if (!el) return;
    if (document.documentElement.getAttribute("data-boot") !== "on") {
      el.remove(); // no toca arrancar: fuera del DOM y a otra cosa
      return;
    }

    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var done = false;
    // 0 = se queda esperando, como la referencia. Ver AUTO_MS en boot-data.mjs.
    var auto = Number(el.getAttribute("data-auto")) || 0;
    var timers = [];
    if (auto > 0) timers.push(setTimeout(enter, auto));

    var btn = document.getElementById("boot-enter");
    var nodes = el.querySelectorAll(".r");

    // Cada elemento sale a SU hora, no en cadena. Los tiempos vienen del
    // frontmatter por `data-d`: un `is:inline` no ve las variables de Astro.
    for (var i = 0; i < nodes.length; i++) {
      (function (n) {
        var ms = reduce ? 0 : Number(n.getAttribute("data-d")) || 0;
        timers.push(
          setTimeout(function () {
            n.classList.add("on");
            if (n.hasAttribute("data-numbers") && !reduce) contar(n);
          }, ms),
        );
      })(nodes[i]);
    }

    // Contador de memoria. Arranca en la hora NOMINAL, no en la visible: en la
    // referencia sale del mismo setTimeout que enciende la linea, asi que sus
    // primeros 500 ms corren escondidos detras del visibility. Es a proposito.
    function contar(n) {
      var vals = n.getAttribute("data-numbers").split(",");
      var ivs = n.getAttribute("data-intervals").split(",").map(Number);
      var k = 0;
      n.textContent = vals[0];
      (function paso() {
        var espera = ivs[k];
        if (++k >= vals.length) return;
        timers.push(
          setTimeout(function () {
            n.textContent = vals[k];
            paso();
          }, espera),
        );
      })();
    }

    function onTouch(e) {
      e.preventDefault(); // sin esto, el toque deja un clic fantasma en el enlace de debajo
      enter();
    }

    function enter() {
      if (done) return;
      done = true;
      for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
      // Los listeners se quitan SIEMPRE: el de touchstart lleva preventDefault
      // y dejarlo puesto mata el scroll tactil del sitio entero.
      removeEventListener("keydown", enter, true);
      removeEventListener("pointerdown", enter, true);
      removeEventListener("touchstart", onTouch, true);

      try {
        localStorage.setItem("boot_seen", "1");
      } catch (e) {
        /* modo privado */
      }

      // "off" en vez de quitar el atributo: devuelve el scroll pero mantiene la
      // pantalla visible mientras se apaga.
      document.documentElement.setAttribute("data-boot", "off");

      var fin = function () {
        el.remove();
        document.documentElement.removeAttribute("data-boot");
        var main = document.getElementById("contenido");
        if (main) {
          main.setAttribute("tabindex", "-1");
          main.focus({ preventScroll: true });
        }
      };
      if (reduce) return fin();
      el.classList.add("is-off");
      setTimeout(fin, 300);
    }

    // Saltable desde el primer frame, por cualquier via.
    addEventListener("keydown", enter, true);
    addEventListener("pointerdown", enter, true);
    addEventListener("touchstart", onTouch, { capture: true, passive: false });

    if (btn) {
      btn.addEventListener("click", enter);
      try {
        btn.focus();
      } catch (e) {}
    }
  })();
</script>

<style>
  /* AcPlus IBM VGA 8x16 — VileR, https://int10h.org/oldschool-pc-fonts/ (CC BY-SA 4.0).
     La licencia completa viaja con el fichero, en /fonts/, y el crédito que
     exige está en el pie del sitio.

     ⚠️ Tiene que ser la variante **AcPlus** (aspect-corrected), no Web/WebPlus.
     La 8x16 original se veía en una VGA de 720x400 estirada a una pantalla 4:3,
     o sea con el píxel más alto que ancho. AcPlus lleva ese estirón dentro: el
     avance es 0,4167em (9,99px a 24px) en vez de 0,5em. Con WebPlus las letras
     salen cuadradas y anchas, y eso solo ya rompe el parecido por mucho que
     cuadre todo lo demás. */
  @font-face {
    font-family: "AcPlus IBM VGA 8x16";
    src: url("/fonts/AcPlus_IBM_VGA_8x16.woff2") format("woff2");
    font-weight: 400;
    font-style: normal;
    /* `block`: nada aparece antes de 1,5 s, así que da tiempo de sobra a
       cargarla y nadie ve una línea en la tipografía de reserva saltando. */
    font-display: block;
  }

  /* Por defecto NO existe. Solo el script inline la enciende: si el JS falla,
     el visitante ve el portfolio y no una pantalla negra sin salida. */
  #boot {
    display: none;
  }
  :global(html[data-boot="on"]) #boot,
  :global(html[data-boot="off"]) #boot {
    display: block;
    position: fixed;
    inset: 0;
    /* Por encima de todo, incluidas las capas de CRT del sitio (z 58-60) y el
       enlace de saltar al contenido (z 100). */
    z-index: 200;
    overflow: hidden;
  }
  /* Nada de scroll por detrás mientras arranca. */
  :global(html[data-boot="on"] body) {
    overflow: hidden;
  }

  /* ── Base ────────────────────────────────────────────────────────────────
     Referencia: body{background:#060606;color:#b3b3b3}
                 span{color:#dedede;font-size:24px;line-height:1.3}
     Y NADA de color. Un POST de VGA en modo texto era gris sobre negro. En
     cuanto metes tres colores deja de parecer una BIOS y parece un tema de
     terminal. */
  #boot {
    background: #060606;
    color: #b3b3b3;
    font-family: "AcPlus IBM VGA 8x16", var(--font-mono), monospace;
    font-size: 24px;
    line-height: 1.3;
  }
  /* Un móvil de 390px no da para 24px. Como las columnas van en `ch`, la
     rejilla entera encoge con la fuente y mantiene la forma. Es lo único que
     no se copia, porque la referencia sencillamente desborda en el móvil. */
  @media (max-width: 700px) {
    #boot {
      font-size: 16px;
    }
  }

  /* `main{padding:1%}` de la referencia, más los 8px de margen de su body. */
  .boot-inner {
    padding: calc(8px + 1%);
    height: 100dvh;
    overflow: hidden;
  }
  .boot-screen {
    position: relative;
  }

  #boot span {
    display: inline-block;
    color: #dedede;
  }

  /* ── La aparición ────────────────────────────────────────────────────────
     Copiado literal de la referencia, y NO es un fundido aunque lo parezca.
     `visibility` dura 0s pero tiene 0,5s de RETARDO, así que la opacidad sube
     de 0 a 1 con el elemento todavía en `hidden`. Cuando por fin se ve, ya
     está opaco: cada línea aparece de golpe, 500 ms después de la hora que
     dice `boot-data.mjs`.

     Medido sobre la referencia: "Loading..." tiene retardo 1400 y se ve a los
     1898 ms, con opacity ya en 1. Es un fallo suyo, pero se ve y se copia.
     ⚠️ NO lo "arregles" quitando la línea de visibility: cambiarías la
     pantalla entera de carácter. */
  .r {
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 0.5s ease,
      visibility 0s 0.5s;
  }
  .r.on {
    opacity: 1;
    visibility: visible;
  }

  /* Los <br><br> de la referencia van fuera de los spans, o sea a la altura de
     línea de su body (16px), no a la de 24px del texto. Medido: 32px. */
  .boot-gap {
    height: 1.3em;
  }

  /* ── La rejilla ──────────────────────────────────────────────────────────
     Referencia:
       .aligned-section              { display:flex; flex-wrap:wrap; gap:20px }
       .aligned-section span         { min-width:200px }
       .aligned-section span:nth-child(2) { min-width:40px; text-align:center }
       .number { width:20px; text-align:right }  .unit { margin-left:-20px }
       y el bloque de specs con gap:50px.

     Aquí va en `ch` y no en px: a 24px un `ch` de esta fuente mide 9,99px, así
     que 20ch son esos 200px clavados — pero además encogen solos cuando el
     móvil baja la fuente. Con px fijos no encogerían.

     Comprobación: etiqueta en x=20, puntos en 240, veredicto en 300, valor de
     spec en 270 y la unidad en 340. Son los de la referencia. */
  .aligned-section {
    display: flex;
    flex-wrap: wrap; /* en pantalla estrecha parte la línea, como la referencia */
    gap: 2ch;
  }
  .aligned-section > span {
    min-width: 20ch;
  }
  .aligned-section > span:nth-child(2) {
    min-width: 4ch;
    text-align: center;
  }
  .aligned-section > span:last-child {
    text-align: left;
  }
  .aligned-section--wide {
    gap: 5ch;
  }
  .aligned-section > .unit {
    margin-left: -2ch;
  }

  /* ── Cabecera ────────────────────────────────────────────────────────────
     Icono a la izquierda, dos líneas al lado, y la marca del fabricante
     flotando a la derecha con su raya y su leyenda, como un PC de 1998. */
  .boot-container {
    display: flex;
    align-items: flex-start;
    position: relative;
    width: 100%;
  }
  .boot-icon {
    flex: none;
    margin-right: 15px;
  }
  .text-container {
    display: flex;
    flex-direction: column;
  }
  .boot-logo {
    position: absolute;
    right: 0;
    top: 10%;
    text-align: center;
  }
  .boot-mark {
    display: block;
    padding-top: 4px;
    border-top: 2px solid #6ee27a;
    color: #6ee27a !important;
    white-space: nowrap;
    font-size: 0.8em;
  }
  /* En móvil no hay sitio: el texto manda. */
  @media (max-width: 700px) {
    .boot-logo {
      display: none;
    }
  }

  /* ── El prompt ───────────────────────────────────────────────────────────
     No parpadea con opacidad: invierte el vídeo, negro sobre blanco y vuelta,
     en saltos secos. Es el cursor de bloque de una consola de texto. */
  #boot-enter {
    /* Los ocho <br> de la referencia: 112px de aire medidos. */
    margin-top: calc(1.3em * 3.6);
    padding: 0;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: #ffffff;
  }
  #boot-enter:focus-visible {
    outline: 2px solid #dedede;
    outline-offset: 4px;
  }
  .blinking {
    display: inline-block;
    animation: blink-effect 1s steps(1, start) infinite;
  }
  @keyframes blink-effect {
    0% {
      color: #ffffff;
      background-color: #060606;
    }
    50% {
      color: #060606;
      background-color: #ffffff;
    }
    100% {
      color: #ffffff;
      background-color: #060606;
    }
  }

  /* Sin scanlines, sin viñeteado, sin curvatura: la referencia no lleva
     ninguno y es lo primero que convierte el homenaje en parodia. Lo único que
     hay es el apagado del tubo al salir, que tapa el cambio al portfolio (la
     referencia no lo necesita porque navega a otra página). */
  #boot.is-off {
    animation: crt-off 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }
  @keyframes crt-off {
    0% {
      transform: scaleY(1) scaleX(1);
      filter: brightness(1);
    }
    55% {
      transform: scaleY(0.008) scaleX(1);
      filter: brightness(3.5);
    }
    100% {
      transform: scaleY(0.008) scaleX(0);
      filter: brightness(6);
      opacity: 0;
    }
  }

  /* Sin movimiento: el texto entero de golpe, sin contador, sin parpadeo y sin
     apagado. */
  @media (prefers-reduced-motion: reduce) {
    .r {
      transition: none;
    }
    .blinking {
      animation: none;
    }
    #boot.is-off {
      animation: none;
    }
  }
</style>
````

- [ ] **Step 2: Comprobar tipos y construir**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints` y `6 page(s) built`. Los tests de la Task 1 corren primero y siguen verdes.

Si sale `Cannot find name 'HEAD'` o similar, es que falta el `import` del frontmatter.

- [ ] **Step 3: Levantar la vista previa**

```bash
pnpm preview --port 4321 &
```

Esperar a que responda: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4321/` → `200`.

- [ ] **Step 4: Medir contra los números de la referencia**

Lanzar Chrome de Windows con el puerto de depuración:

```bash
powershell.exe -NoProfile -Command "Start-Process -FilePath 'C:\Program Files\Google\Chrome\Application\chrome.exe' -ArgumentList '--headless=new','--remote-debugging-port=9222','--remote-allow-origins=*','--disable-gpu','--hide-scrollbars','--window-size=1280,900','about:blank'"
```

Crear `/tmp/claude-1000/-home-adelg/<sesion>/scratchpad/paridad.mjs`:

```js
import { writeFileSync } from 'node:fs';
const OUT = process.env.SCRATCH;
const t = (await (await fetch('http://127.0.0.1:9222/json/list')).json()).find(x => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (pend.has(m.id)) pend.get(m.id)(m), pend.delete(m.id); };
const send = (m, p = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const js = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result.value;
const sleep = ms => new Promise(r => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:4321/proyectos/' });
await sleep(1200); await js('localStorage.clear()');
await send('Page.navigate', { url: 'http://127.0.0.1:4321/' });
await sleep(6000);
const s = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync(`${OUT}/paridad.png`, Buffer.from(s.result.data, 'base64'));

// Los numeros que tienen que salir. Son los de la referencia.
const ESPERADO = {
  fontSize: '24px', lineHeight: '31.2px', bg: 'rgb(6, 6, 6)', ch: 9.99,
  colores: ['rgb(222, 222, 222)', 'rgb(110, 226, 122)'],
  columnas: { etiqueta: 20, puntos: 240, veredicto: 300, valorSpec: 270, unidad: 340 },
};
const real = await js(`(() => {
  const b = document.getElementById('boot'), cs = getComputedStyle(b);
  const p = document.createElement('span');
  p.style.cssText = 'position:absolute;visibility:hidden;font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize;
  p.textContent = 'M'.repeat(100); b.appendChild(p);
  const ch = Math.round(p.getBoundingClientRect().width / 100 * 100) / 100; p.remove();
  const sec = [...document.querySelectorAll('.aligned-section')];
  const x = n => Math.round(n.getBoundingClientRect().left);
  const dev = sec[3], spec = sec[0], cnt = sec[2];
  return {
    fontSize: cs.fontSize, lineHeight: cs.lineHeight, bg: cs.backgroundColor, ch,
    colores: [...new Set([...b.querySelectorAll('span')].map(n => getComputedStyle(n).color))],
    columnas: {
      etiqueta: x(dev.children[0]), puntos: x(dev.children[1]), veredicto: x(dev.children[2]),
      valorSpec: x(spec.children[1]), unidad: x(cnt.children[2]),
    },
    texto: document.querySelector('.boot-text').innerText,
    prompt: document.getElementById('boot-enter').innerText.trim(),
    desborda: document.documentElement.scrollWidth > innerWidth,
  };
})()`);
const fallos = [];
for (const k of ['fontSize', 'lineHeight', 'bg', 'ch']) if (String(real[k]) !== String(ESPERADO[k])) fallos.push(`${k}: ${real[k]} != ${ESPERADO[k]}`);
for (const [k, v] of Object.entries(ESPERADO.columnas)) if (real.columnas[k] !== v) fallos.push(`columna ${k}: ${real.columnas[k]} != ${v}`);
for (const c of real.colores) if (!ESPERADO.colores.includes(c)) fallos.push(`color de mas: ${c}`);
if (real.desborda) fallos.push('desborda a lo ancho');
if (/[áéíóúñ¿¡]/i.test(real.texto) || /comecocos/i.test(real.texto)) fallos.push('queda texto en espanol o comecocos');
if (real.prompt !== '[PRESS ANY KEY TO CONTINUE]') fallos.push(`prompt: ${real.prompt}`);
console.log(real.texto);
console.log(JSON.stringify(real.columnas), 'ch=' + real.ch);
console.log(fallos.length ? 'FALLOS:\n - ' + fallos.join('\n - ') : 'PARIDAD OK');
ws.close();
```

Run: `SCRATCH=<scratchpad> node paridad.mjs`
Expected: `PARIDAD OK`, y el texto impreso tiene que ser exactamente el del spec §3 con la identidad cambiada.

- [ ] **Step 5: Mirar la captura al lado de la referencia**

Abrir `paridad.png` y compararla con `ref-5200.png` (la captura de la referencia). Tienen que ser la misma pantalla salvo el nombre, el sello y el pingüino.

- [ ] **Step 6: Comprobar el comportamiento**

Con el mismo Chrome, verificar los 13 puntos:

1. arranca en `/`
2. una tecla lo quita
3. deja `boot_seen` en `localStorage`
4. vuelve el scroll (`scrollTo(0,600)` → `scrollY > 0`)
5. el portfolio está detrás (`#contenido` existe)
6. la segunda visita no arranca
7. `/work/` nunca arranca
8. un enlace profundo (`/proyectos/`) no arranca
9. `/index.html` arranca
10. un clic lo quita
11. con `prefers-reduced-motion` todo está visible a los 0,5 s
12. con `prefers-reduced-motion` el prompt no parpadea (`animationName === 'none'`)
13. `document.fonts.check('24px "AcPlus IBM VGA 8x16"')` es `true`

Expected: los 13 en verde.

- [ ] **Step 7: Matar la vista previa y Chrome**

```bash
kill $(ss -lntp 2>/dev/null | grep 4321 | grep -oP 'pid=\K[0-9]+')
powershell.exe -NoProfile -Command "Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue; exit 0"
```

Comprobar que los puertos 4321 y 9222 quedan libres.

- [ ] **Step 8: Commit**

```bash
git add src/components/Boot.astro
git commit -m "Arranque con paridad 100%: texto en ingles, maqueta y CSS de la referencia"
```

---

### Task 3: Documentación, atribución y despliegue

**Files:**
- Modify: `README.md` (la sección «Pantalla de arranque»)
- Verify: `src/components/Footer.astro` (el crédito de la tipografía ya está; solo comprobar)

**Interfaces:**
- Consumes: nada.
- Produces: nada.

- [ ] **Step 1: Reescribir la sección del README**

Reemplazar todo lo que hay entre `## Pantalla de arranque` y `## Easter egg`:

```markdown
## Pantalla de arranque

`src/components/Boot.astro` + `src/components/boot-data.mjs`. POST de BIOS falso
que tapa la portada la primera vez. Se salta con cualquier tecla, clic o toque.

**Es un homenaje calcado a la pantalla de arranque de
[senna.social](https://senna.social/).** La maqueta, los colores, los tiempos y
el texto son suyos; aquí solo cambia la identidad (el nombre, ADCSOFT y un
pingüino en lugar de su logo). No se copia ningún fichero suyo: los dibujos son
SVG propios.

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
```

- [ ] **Step 2: Comprobar que el crédito de la fuente sigue en el pie**

Run: `grep -n "AcPlus IBM VGA 8x16" src/components/Footer.astro`
Expected: una línea, con el enlace a `int10h.org` y a `/fonts/LICENSE-oldschool-pc-fonts.txt`.

Si no aparece, la licencia CC BY-SA 4.0 se estaría incumpliendo: hay que restaurarlo antes de seguir.

- [ ] **Step 3: Build limpio**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints`, `6 page(s) built`.

- [ ] **Step 4: Commit y push**

```bash
git add README.md docs/superpowers/
git commit -m "Documenta la paridad del arranque y de donde sale cada numero"
git push
```

- [ ] **Step 5: Esperar al deploy y verificar en vivo**

```bash
gh run list --limit 1 --json status,conclusion,headSha
```
Expected: `completed / success` con el SHA del push.

Después:

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" https://adc-alt.github.io/fonts/AcPlus_IBM_VGA_8x16.woff2
curl -s -H 'Cache-Control: no-cache' https://adc-alt.github.io/ | diff - dist/index.html && echo "vivo == build"
```
Expected: `200 15556`, y el HTML vivo idéntico al build.

- [ ] **Step 6: Pedir la comprobación que no se puede hacer aquí**

Chrome sin cabeza siempre dice `pointer: coarse`, y este componente ya no
depende de eso (el prompt es un texto único), pero **la pantalla nunca se ha
abierto en un móvil físico ni en un escritorio real**. Pedir al dueño que la
abra en incógnito en los dos y confirme que:

- a 24 px no desborda en su monitor
- a 16 px se lee entera en su teléfono
- el parpadeo en vídeo inverso no molesta

---

## Self-Review

**1. Cobertura del spec.**

| Requisito del spec | Dónde |
|---|---|
| §1 las tres sustituciones de identidad | Task 1, `HEAD` |
| §1 nada en español, nada de `comecocos` | Task 1, tests 9 y 10 |
| §2 atribución de la referencia y de la fuente | Task 3, pasos 1 y 2 |
| §3 texto literal | Task 1, `SPECS`/`DEVICES`/`TAIL`/`PROMPT` |
| §3 el contador y su escalera | Task 1 `COUNT`; Task 2 función `contar()` |
| §4 tabla de tiempos, pausa de 1,1 s, los 450 ms | Task 1, `T` + tests 1, 2 y 3 |
| §4 no entra sola | Task 1 `AUTO_MS` + test 6 |
| §5 tipografía AcPlus | Task 2, `@font-face` + medición del `ch` |
| §5 tamaño, interlineado, colores | Task 2, bloque `#boot` + medición |
| §5 rejilla de columnas | Task 2, `.aligned-section` + medición de las 5 columnas |
| §5 la aparición seca con 500 ms de retraso | Task 2, bloque `.r` |
| §5 prompt en vídeo inverso | Task 2, `.blinking` |
| §5 sin efectos de CRT | Task 2, comentario + ausencia de reglas |
| §6 solo en `/` y `/index.html`, `boot_seen`, reduced-motion | Task 2, paso 6 (puntos 1-12) |

Sin huecos.

**2. Placeholders.** Ninguno: todos los pasos llevan el código o el comando exacto.

**3. Consistencia de tipos.** Los nombres que exporta `boot-data.mjs` en la Task 1 (`HEAD`, `LOADING`, `SPECS`, `COUNT`, `DEVICES`, `TAIL`, `PROMPT`, `T`, `AUTO_MS`) son exactamente los que importa el frontmatter de la Task 2. Las clases CSS que pinta el marcado (`.r`, `.aligned-section`, `.aligned-section--wide`, `.number`, `.unit`, `.boot-gap`, `.boot-container`, `.boot-icon`, `.text-container`, `.boot-logo`, `.boot-mark`, `.blinking`, `.boot-text`, `.boot-inner`, `.boot-screen`) están todas definidas en el bloque `<style>` del mismo paso. Los `data-*` que lee el script (`data-auto`, `data-d`, `data-numbers`, `data-intervals`) los escribe el mismo marcado.

**Riesgo conocido:** el script de medición de la Task 2 indexa `.aligned-section` por posición (`sec[0]` specs, `sec[2]` la del contador, `sec[3]` el primer chequeo). Si cambia el número de specs, hay que ajustar esos índices.
