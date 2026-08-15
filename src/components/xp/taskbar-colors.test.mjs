import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BODY,
  HEIGHT,
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

test("la ultima parada del degradado esta en HEIGHT", () => {
  // Ancla STOPS a HEIGHT en vez de a un 30 repetido a mano: si HEIGHT
  // cambiara y la ultima parada no la siguiera, este test lo nota.
  const ultima = STOPS[STOPS.length - 1];
  assert.equal(ultima.px, HEIGHT);
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
