import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HEAD, LOADING, SPECS, COUNT, DEVICES, TAIL, PROMPT, T, AUTO_MS, AUTO_MS_REDUCED,
} from "./boot-data.mjs";

/**
 * The reference's delay table, copied verbatim from its textloader.js. If a
 * test here goes red it means someone changed a timing: either put it back, or
 * change this table knowing it no longer matches.
 */
const REF = {
  1: 1000, 2: 1600, 3: 1800, 4: 1200, 5: 1400, 6: 1600,
  7: 1700, 8: 1800, 9: 1900, 10: 3000, 11: 3050, 12: 3100,
  13: 3200, 14: 3250, 15: 3700, 16: 3800, 17: 3900, 18: 4000,
};

test("the timings are the reference's", () => {
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

test("the pause before the checks lasts 1.1s", () => {
  // It is what makes it look like a machine testing itself.
  assert.equal(T.name[0] - T.count, 1100);
});

test("the last verdict keeps you waiting an extra 450ms", () => {
  assert.equal(T.verdict.at(-1) - T.verdict.at(-2), 450);
  assert.equal(T.verdict[1] - T.verdict[0], 50);
});

test("there is one timing per line", () => {
  assert.equal(T.spec.length, SPECS.length);
  assert.equal(T.name.length, DEVICES.length);
  assert.equal(T.verdict.length, DEVICES.length);
});

test("the prompt is the last thing to appear", () => {
  const all = [
    T.title, T.copy, T.loading, T.icon, T.logo, T.count,
    T.tailKey, T.tailValue, ...T.spec, ...T.name, ...T.verdict,
  ];
  assert.equal(Math.max(...all, T.prompt), T.prompt);
});

test("it enters by itself, and not before the last line is legible", () => {
  // The screen used to wait for ever, like the reference. It is the one place
  // parity was dropped on purpose: a visitor who does not recognise a boot
  // screen has no way of knowing it wants a keypress, and stares at a black
  // page until they leave.
  assert.ok(AUTO_MS > 0, "the boot screen waits for ever again");

  // `T.prompt` is when the prompt is TOLD to appear. It reaches the screen
  // 500ms after that, because of the `transition: visibility 0s .5s` in the
  // CSS. Entering any earlier throws away the end of the sequence, and the
  // regression would look like a shorter boot rather than a broken one.
  assert.ok(
    AUTO_MS >= T.prompt + 500,
    `enters at ${AUTO_MS}ms, and the prompt is not on screen until ${T.prompt + 500}ms`,
  );
});

test("less motion means it enters sooner, not that it waits the same", () => {
  // With `reduce` every line is painted at once, so the wait exists to let a
  // sequence finish that is not running.
  assert.ok(AUTO_MS_REDUCED > 0, "reduced motion is back to waiting for ever");
  assert.ok(AUTO_MS_REDUCED < AUTO_MS);
});

test("the counter's ladder ends on the value that is shown", () => {
  const row = SPECS.find((s) => s.count);
  assert.ok(row, "there has to be a row with a counter");
  assert.equal(String(COUNT.numbers.at(-1)), row.v);
});

test("there is one interval per rung of the counter", () => {
  assert.equal(COUNT.intervals.length, COUNT.numbers.length);
});

test("the labels fit in the 20ch column", () => {
  // A longer label pushes the verdict column and knocks the whole grid out of
  // square, which is exactly what must not be touched.
  for (const s of SPECS) assert.ok(s.k.length <= 20, `long spec: ${s.k}`);
  for (const d of DEVICES) assert.ok(d.k.length <= 20, `long check: ${d.k}`);
});

test("all in English: no accents, no enyes, no opening marks", () => {
  const text = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  const bad = text.match(/[áéíóúüñÁÉÍÓÚÜÑ¿¡]/g);
  assert.equal(bad, null, `Spanish characters: ${bad}`);
});

test("no trace of the pac-man is left", () => {
  const text = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  assert.ok(!/comecocos/i.test(text));
});

test("the identity is this portfolio's and not the reference's", () => {
  const text = JSON.stringify([HEAD, LOADING, SPECS, DEVICES, TAIL, PROMPT]);
  assert.ok(/Adc-alt/.test(HEAD.title));
  assert.ok(/ADCSOFT/.test(HEAD.copy));
  assert.ok(!/senna/i.test(text), "traces of the reference's name are left");
  assert.ok(!/SENNASOFT/i.test(text));
});

test("the typeface credit is in markup that ships, not only in a comment", () => {
  // CC BY-SA 4.0 asks for attribution, and the visible colophon that used to
  // carry it was removed at the owner's request. A CSS comment does not
  // survive minification, so the credit is an HTML comment in the markup —
  // which does. Delete it while the site still serves the font and the site is
  // in breach.
  const src = readFileSync(new URL("./Boot.astro", import.meta.url), "utf8");
  const shipped = src.match(/set:html=\{`<!--([\s\S]*?)-->`\}/)?.[1] ?? "";
  assert.match(shipped, /AcPlus IBM VGA 8x16/);
  assert.match(shipped, /VileR/);
  assert.match(shipped, /CC BY-SA 4\.0/);
  assert.match(shipped, /LICENSE-oldschool-pc-fonts\.txt/);
});
