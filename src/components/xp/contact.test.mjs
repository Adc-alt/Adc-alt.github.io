import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("./Contact.astro", import.meta.url), "utf8");

test("the envelope stops moving for anyone who asked for less motion", () => {
  // A four-second loop that never stops is exactly what the reduce setting
  // exists for. The failure this catches is silent: the animation keeps
  // working, so nothing looks broken to whoever removed the guard.
  const guard = src.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n  \}/)?.[1] ?? "";
  assert.match(guard, /\.envelope/);
  assert.match(guard, /animation:\s*none/);
  // Parked, not left at whichever end the keyframes happen to start on.
  assert.match(guard, /transform:\s*translateX\(/);
});

test("the drawing is ours, not a hotlink to somebody else's server", () => {
  // The 90s clipart this echoes has no licence anyone can point at, and the
  // repo is public. An <img> creeping back in is the regression.
  assert.equal(/<img\b/.test(src), false);
  assert.equal(/https?:\/\/(?!schema)/.test(src), false);
});
