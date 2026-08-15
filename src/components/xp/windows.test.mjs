import { test } from "node:test";
import assert from "node:assert/strict";
import { clampPosition, initialPosition, KEEP_VISIBLE } from "./windows.mjs";

// Escritorio de referencia: 1440x900 con la barra de 40.
const DESK = { vw: 1440, vh: 900, barH: 40 };
const WIN = { w: 720, h: 520 };

test("una posición que ya cabe no se toca", () => {
  const p = clampPosition({ ...WIN, x: 300, y: 100 }, DESK);
  assert.deepEqual(p, { x: 300, y: 100 });
});

test("la ventana no se puede empujar entera fuera por la izquierda", () => {
  const p = clampPosition({ ...WIN, x: -5000, y: 100 }, DESK);
  // Queda KEEP_VISIBLE px de ventana asomando por el borde izquierdo.
  assert.equal(p.x + WIN.w, KEEP_VISIBLE);
});

test("lo que asoma por la izquierda incluye barra de titulo, no solo botones", () => {
  // Los tres botones viven pegados al borde derecho de la barra de título y
  // ocupan ~70px. Si KEEP_VISIBLE bajara de ahí, empujar la ventana a la
  // izquierda dejaría asomando solo botones y la ventana no se podría
  // arrastrar de vuelta nunca más. Medido en el DOM con Chrome.
  const ANCHO_BOTONES = 70;
  assert.ok(
    KEEP_VISIBLE - ANCHO_BOTONES >= 30,
    `solo quedan ${KEEP_VISIBLE - ANCHO_BOTONES}px agarrables`,
  );
});

test("ni por la derecha", () => {
  const p = clampPosition({ ...WIN, x: 5000, y: 100 }, DESK);
  assert.equal(p.x, DESK.vw - KEEP_VISIBLE);
});

test("la barra de título nunca sube por encima del borde", () => {
  const p = clampPosition({ ...WIN, x: 300, y: -400 }, DESK);
  assert.equal(p.y, 0);
});

test("la barra de título nunca se esconde detrás de la barra de tareas", () => {
  const p = clampPosition({ ...WIN, x: 300, y: 5000 }, DESK);
  // El tope de abajo lo pone la barra de tareas, no el alto de la ventana.
  assert.equal(p.y, DESK.vh - DESK.barH - KEEP_VISIBLE);
  assert.ok(p.y + KEEP_VISIBLE <= DESK.vh - DESK.barH);
});

test("una ventana más alta que la pantalla se sigue pudiendo arrastrar", () => {
  // El fallo que este clamp evita: si el tope de abajo fuera `bottom - h`, con
  // h > bottom saldría negativo, el clamp lo pelearía con el 0 de arriba y la
  // ventana se quedaría clavada.
  const alta = { w: 720, h: 5000 };
  const p = clampPosition({ ...alta, x: 300, y: 200 }, DESK);
  assert.equal(p.y, 200);
});

test("en una pantalla diminuta la posición sigue siendo válida", () => {
  const movil = { vw: 360, vh: 640, barH: 40 };
  const p = initialPosition({ w: 720, h: 520 }, movil);
  assert.ok(p.x <= movil.vw - KEEP_VISIBLE, `x=${p.x}`);
  assert.ok(p.y >= 0, `y=${p.y}`);
  assert.ok(p.y <= movil.vh - movil.barH - KEEP_VISIBLE, `y=${p.y}`);
});

test("la posición inicial centra en horizontal", () => {
  const p = initialPosition(WIN, DESK);
  assert.equal(p.x, (DESK.vw - WIN.w) / 2);
  // Por encima del centro, como abre Windows: menos de la mitad del hueco.
  assert.ok(p.y < (DESK.vh - DESK.barH - WIN.h) / 2, `y=${p.y}`);
});
