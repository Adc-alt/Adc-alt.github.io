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

test("the body is the blue from the desktop capture", () => {
  assert.equal(hex(BODY), "#245edc");
});

test("the strip rows are re-tinted onto the capture's body", () => {
  // Computed by applying each strip row's per-channel multiplier (§4.1) to the
  // capture's body (§4.2). Change BODY and all of these change.
  assert.equal(hex(tint(1)), "#2767d1");
  assert.equal(hex(tint(3)), "#2c68db");
  assert.equal(hex(tint(4)), "#2d66de");
  assert.equal(hex(tint(21)), "#1c49c3");
  assert.equal(hex(tint(22)), "#153bae");
  assert.equal(hex(tint(23)), "#103198");
});

test("a row that is not in the strip is body", () => {
  assert.deepEqual(tint(12), BODY);
});

test("the Start button's highlight is lighter than its body", () => {
  // Re-tinted like the strip rows: the multiplier comes from a capture whose
  // green is not ours. Less contrast against white = lighter colour. It is a
  // 3px band right at the top and the text does not fall on it, so it does not
  // change the real contrast of "start".
  assert.equal(hex(startHighlight()), "#6dc76d");
  assert.ok(
    contrastWithWhite(startHighlight()) < contrastWithWhite(START_BODY),
    "the highlight has to be lighter than the body",
  );
});

test("our bar has the profile of §4.1", () => {
  assert.deepEqual(checkProfile(STOPS), []);
});

// ── Positive controls ──────────────────────────────────────────────────────
// A probe that only passes our own bar checks nothing. These three are the
// wrong ways to paint the bar, and the probe has to reject all three.

test("the probe rejects a flat bar", () => {
  const flat = [
    { px: 0, rgb: BODY },
    { px: HEIGHT, rgb: BODY },
  ];
  assert.ok(checkProfile(flat).length > 0, "a flat bar should fail");
});

test("the probe rejects a two-stop gradient", () => {
  const two = [
    { px: 0, rgb: tint(4) },
    { px: HEIGHT, rgb: tint(23) },
  ];
  assert.ok(checkProfile(two).length > 0, "two stops should fail");
});

test("the probe rejects a smooth top-to-bottom gradient", () => {
  // The mistake §4.1 warns about expressly: it looks right and is not, because
  // XP's body is flat and this one keeps changing over the whole height.
  const smooth = [
    { px: 0, rgb: tint(1) },
    { px: 3, rgb: tint(4) },
    { px: Math.round(HEIGHT / 2), rgb: BODY },
    { px: HEIGHT - 4, rgb: tint(21) },
    { px: HEIGHT - 3, rgb: tint(22) },
    { px: HEIGHT - 2, rgb: tint(23) },
    { px: HEIGHT, rgb: tint(23) },
  ];
  assert.ok(checkProfile(smooth).length > 0, "the body is not flat and it should fail");
});

test("the probe rejects a shadow that does not darken in order", () => {
  // HEIGHT-3 is the second of the three closing dark rows. It is derived and not
  // written by hand: with the literal 27 from when the bar was 30 tall, raising
  // HEIGHT left this case touching no stop at all and the test approved STOPS as
  // they were — that is, it stopped checking anything.
  const row = HEIGHT - 3;
  const scrambled = STOPS.map((s) => (s.px === row ? { px: row, rgb: tint(4) } : s));
  assert.notDeepEqual(scrambled, STOPS, "the case has to change some stop");
  assert.ok(checkProfile(scrambled).length > 0, "a reversed shadow should fail");
});

// ── Contrast ───────────────────────────────────────────────────────────────

test("the gradient comes out as CSS with stops in pixels", () => {
  const css = gradient();
  assert.match(css, /^linear-gradient\(to bottom,/);
  assert.ok(css.includes("#245edc 6px"), css);
  assert.ok(css.includes(`#103198 ${HEIGHT}px`), css);
});

test("the edge and the shadow do not scale with HEIGHT, the body does", () => {
  // What keeps the bar looking like XP when its height changes: the 6px light
  // edge and the 4px shadow are fixed, and what stretches is the flat run in
  // the middle.
  const px = (i) => STOPS[i].px;
  assert.equal(px(4), 6, "the light edge ends at 6px whatever happens");
  assert.equal(px(5), HEIGHT - 4, "the flat body reaches HEIGHT-4");
  assert.equal(px(STOPS.length - 1), HEIGHT);
});

test("the gradient's last stop is at HEIGHT", () => {
  // Anchors STOPS to HEIGHT instead of to a 30 repeated by hand: if HEIGHT
  // changed and the last stop did not follow, this test notices.
  const last = STOPS[STOPS.length - 1];
  assert.equal(last.px, HEIGHT);
});

test("white on green and on the tray meets AA large", () => {
  // §10.1: they do NOT meet AA for body text (4.5:1) and that is a decision that
  // was taken and documented. What this test blocks is them dropping below the
  // floor they do meet: 3:1, AA for large text. If you touch the colours and
  // this goes red, you have made accessibility worse without noticing.
  const green = contrastWithWhite(START_BODY);
  const tray = contrastWithWhite(TRAY_BODY);
  assert.ok(green >= 3, `white on green: ${green.toFixed(2)}:1`);
  assert.ok(tray >= 3, `white on tray: ${tray.toFixed(2)}:1`);
  // The values from §10.1, pinned so a change gets noticed.
  assert.equal(green.toFixed(2), "3.50");
  assert.equal(tray.toFixed(2), "3.39");
});
