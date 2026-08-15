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
