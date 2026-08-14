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
