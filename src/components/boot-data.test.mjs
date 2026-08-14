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
