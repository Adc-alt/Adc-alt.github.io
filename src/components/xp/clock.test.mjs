import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTime, msToNextMinute } from "./clock.mjs";

// LOCAL dates on purpose: the tray shows the visitor's time, not UTC. With
// `new Date(y, m, d, ...)` the test does not depend on the TZ of whoever runs
// it, because it builds and reads from the same side.
const at = (h, m, s = 0, ms = 0) => new Date(2026, 0, 15, h, m, s, ms);

test("pads with a leading zero", () => {
  assert.equal(formatTime(at(9, 5)), "09:05");
  assert.equal(formatTime(at(0, 7)), "00:07");
});

test("24h, not 12h and no am/pm", () => {
  assert.equal(formatTime(at(0, 0)), "00:00");
  assert.equal(formatTime(at(12, 0)), "12:00");
  assert.equal(formatTime(at(13, 0)), "13:00");
  assert.equal(formatTime(at(23, 59)), "23:59");
});

test("msToNextMinute lands exactly on the whole minute", () => {
  assert.equal(msToNextMinute(at(10, 30, 59, 500)), 500);
  assert.equal(msToNextMinute(at(10, 30, 30, 0)), 30000);
});

test("on second zero it waits a whole minute, not zero", () => {
  // If it returned 0, the setTimeout would fire in an endless loop.
  assert.equal(msToNextMinute(at(10, 30, 0, 0)), 60000);
});
