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
