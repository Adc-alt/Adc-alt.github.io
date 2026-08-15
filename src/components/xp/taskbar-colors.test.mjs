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
  startHighlight,
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

test("el brillo del boton de Inicio es mas claro que su cuerpo", () => {
  // Retenido igual que las filas de la tira: el multiplicador sale de una
  // captura cuyo verde no es el nuestro. Menos contraste contra blanco =
  // color mas claro. Es una banda de 3px arriba del todo y el texto no cae
  // encima, asi que no cambia el contraste real de «start».
  assert.equal(hex(startHighlight()), "#6dc76d");
  assert.ok(
    contrastWithWhite(startHighlight()) < contrastWithWhite(START_BODY),
    "el brillo tiene que ser mas claro que el cuerpo",
  );
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
    { px: HEIGHT, rgb: BODY },
  ];
  assert.ok(checkProfile(plana).length > 0, "una barra plana deberia fallar");
});

test("la sonda rechaza un degradado de dos paradas", () => {
  const dos = [
    { px: 0, rgb: tint(4) },
    { px: HEIGHT, rgb: tint(23) },
  ];
  assert.ok(checkProfile(dos).length > 0, "dos paradas deberian fallar");
});

test("la sonda rechaza un degradado suave de arriba abajo", () => {
  // El fallo que §4.1 avisa expresamente: parece bien y no lo esta, porque el
  // cuerpo de XP es plano y aqui va cambiando en todo el alto.
  const suave = [
    { px: 0, rgb: tint(1) },
    { px: 3, rgb: tint(4) },
    { px: Math.round(HEIGHT / 2), rgb: BODY },
    { px: HEIGHT - 4, rgb: tint(21) },
    { px: HEIGHT - 3, rgb: tint(22) },
    { px: HEIGHT - 2, rgb: tint(23) },
    { px: HEIGHT, rgb: tint(23) },
  ];
  assert.ok(checkProfile(suave).length > 0, "el cuerpo no esta plano y deberia fallar");
});

test("la sonda rechaza una sombra que no oscurece en orden", () => {
  // HEIGHT-3 es la segunda de las tres filas oscuras del final. Va derivado y
  // no escrito a mano: con el 27 literal de cuando la barra medía 30, subir
  // HEIGHT dejaba este caso sin tocar ninguna parada y el test aprobaba STOPS
  // tal cual, o sea dejaba de comprobar nada.
  const fila = HEIGHT - 3;
  const desordenada = STOPS.map((s) =>
    s.px === fila ? { px: fila, rgb: tint(4) } : s,
  );
  assert.notDeepEqual(desordenada, STOPS, "el caso tiene que cambiar alguna parada");
  assert.ok(checkProfile(desordenada).length > 0, "la sombra al reves deberia fallar");
});

// ── Contraste ──────────────────────────────────────────────────────────────

test("el degradado sale como CSS con paradas en pixeles", () => {
  const css = gradient();
  assert.match(css, /^linear-gradient\(to bottom,/);
  assert.ok(css.includes("#245edc 6px"), css);
  assert.ok(css.includes(`#103198 ${HEIGHT}px`), css);
});

test("el filo y la sombra no escalan con HEIGHT, el cuerpo si", () => {
  // Lo que hace que la barra siga pareciendo XP al cambiarle el alto: los
  // 6px de filo claro y los 4 de sombra son fijos, y lo que se estira es el
  // tramo plano de en medio.
  const px = (i) => STOPS[i].px;
  assert.equal(px(4), 6, "el filo claro termina en 6px pase lo que pase");
  assert.equal(px(5), HEIGHT - 4, "el cuerpo plano llega hasta HEIGHT-4");
  assert.equal(px(STOPS.length - 1), HEIGHT);
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
