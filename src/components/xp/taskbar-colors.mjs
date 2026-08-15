/**
 * The colours of the Luna taskbar.
 *
 * Measured, not chosen. The reason behind every number is in
 * docs/superpowers/specs/2026-08-15-xp-desktop-phase1-design.md §4.
 *
 * What you need to know so as not to break it: there are TWO reference captures
 * and their blues do NOT match. The spec (§4.4) settles it — the COLOUR comes
 * from the desktop capture and the STRUCTURE comes from the native strip. That
 * is why the strip's rows are stored as a per-channel MULTIPLIER against the
 * body of their own capture, and not as absolute colours: the shape survives a
 * change of blue and the derivation stays visible instead of applied by hand.
 */

/**
 * Height of the bar, in px.
 *
 * What is measured on the native capture at 96 dpi (§4.2) is 30. Here it is 40:
 * XP was designed for 1024x768 and those 30px were 3.9% of the screen; on a
 * monitor today the same number is a scrawny strip that does not match the
 * memory. It is a scale decision taken by eye and on request, not a measurement
 * — the rest of this file is measurements.
 *
 * `Taskbar.astro` receives it as `--bar-h` and the `STOPS` below are computed
 * from this number: both derive from the same place and cannot drift apart
 * silently if it ever changes. What does NOT scale with it are the top edge and
 * the bottom shadow, which are pixel details: they still measure 6 and 4px, and
 * what stretches is the flat body.
 */
export const HEIGHT = 40;

/** The body of the bar. Desktop capture 640x480, §4.2. #245edc */
export const BODY = [36, 94, 220];

/** Start button, §4.2. Body #259e25, border #1d861d. */
export const START_BODY = [37, 158, 37];
export const START_EDGE = [29, 134, 29];

/**
 * The light band on the first two rows of the Start button.
 *
 * Measured on the native 1920x1080 capture: peak (150,196,150) on a body of
 * (51,156,51) — which is NOT the START_BODY of §4.2, it is that other capture's.
 * That is why it is stored as a per-channel multiplier and not as an absolute
 * colour, the same rule as STRIP_ROWS: the highlight survives a change of green
 * instead of being welded to one particular capture.
 */
const START_CAPTURE_BODY = [51, 156, 51];
const START_HIGHLIGHT_SRC = [150, 196, 150];

/** The highlight at the top of the button, re-tinted onto `body`. */
export const startHighlight = (body = START_BODY) =>
  START_HIGHLIGHT_SRC.map((c, i) => (c / START_CAPTURE_BODY[i]) * body[i]);

/** System tray, §4.3. It is LIGHTER than the bar, not darker. */
export const TRAY_BODY = [18, 144, 233]; // #1290e9
export const TRAY_FOOT = [15, 110, 209]; // #0f6ed1  last row
export const TRAY_EDGE = [55, 112, 168]; // #3770a8  the edge that sinks it

/** Body of the native 800x24 strip, empty column x=390, §4.1. #3980f4 */
const STRIP_BODY = [57, 128, 244];

/**
 * Strip row → RGB. Rows 5-20 are the body, which is why they are not here.
 *
 * §4.1 calls row 4 the "lightest point": it is, by blue channel, but by
 * luminance the lightest is row 3. It does not matter, and the ordering
 * survives re-tinting — but that is why `checkProfile` checks "the high band
 * beats the body" and not "row 4 is the maximum".
 */
const STRIP_ROWS = {
  1: [62, 140, 232], // #3e8ce8  first light edge
  3: [69, 142, 243], // #458ef3  high band
  4: [71, 139, 246], // #478bf6  lightest point
  21: [45, 100, 216], // #2d64d8  starts darkening
  22: [33, 81, 193], // #2151c1
  23: [26, 67, 169], // #1a43a9  bottom edge
};

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));

export const hex = (rgb) =>
  "#" + rgb.map((c) => clamp(c).toString(16).padStart(2, "0")).join("");

/** The colour of one strip row, re-tinted onto `body`. */
export function tint(row, body = BODY) {
  const src = STRIP_ROWS[row];
  if (!src) return body.slice();
  return src.map((c, i) => (c / STRIP_BODY[i]) * body[i]);
}

/** Width of the strip's top light edge, fixed (§4.1). */
const HIGHLIGHT_PX = 6;
/** Width of the strip's closing shadow, fixed (§4.1). */
const SHADOW_PX = 4;
/** The pixel where the flat body ends and the closing shadow starts. */
const SHADOW_START = HEIGHT - SHADOW_PX;

/**
 * Gradient stops for a bar of HEIGHT px.
 *
 * The actual split: light edge 0→6px, flat body 6→(HEIGHT-4), closing shadow the
 * last 4px. The edge and the shadow are pixel details and do NOT scale with
 * HEIGHT; what stretches when the bar grows is the flat body, which is what XP
 * really does. The reference strip has 23 usable rows, but this split is the one
 * measured in §4.1 and not a literal rule of three over those 23 rows — do not
 * "fix" it by moving {px: 6} to {px: 5} so it squares with the strip's
 * proportion: you would change the gradient that is already in production.
 *
 * The stops are in PIXELS and not percentages: the bar has a fixed height, so
 * the 1px edge really measures 1px on any screen. The repeated stops
 * (SHADOW_START, +1, +2) are hard cuts on purpose: in XP those three rows darken
 * abruptly, not on a ramp.
 */
export const STOPS = [
  { px: 0, rgb: tint(1) },
  { px: 1, rgb: tint(1) },
  { px: 1, rgb: tint(3) },
  { px: 3, rgb: tint(4) },
  { px: HIGHLIGHT_PX, rgb: BODY },
  { px: SHADOW_START, rgb: BODY },
  { px: SHADOW_START, rgb: tint(21) },
  { px: SHADOW_START + 1, rgb: tint(21) },
  { px: SHADOW_START + 1, rgb: tint(22) },
  { px: SHADOW_START + 2, rgb: tint(22) },
  { px: SHADOW_START + 2, rgb: tint(23) },
  { px: HEIGHT, rgb: tint(23) },
];

export const gradient = (stops = STOPS) =>
  "linear-gradient(to bottom," +
  stops.map((s) => `${hex(s.rgb)} ${s.px}px`).join(",") +
  ")";

/** WCAG relative luminance. */
function luminance([r, g, b]) {
  const lin = (c) => {
    const s = clamp(c) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio against pure white. */
export const contrastWithWhite = (rgb) => 1.05 / (luminance(rgb) + 0.05);

/**
 * The profile probe. Returns the list of failures; empty means the bar has the
 * shape of §4.1.
 *
 * It exists so it can FAIL: the test hands it a flat bar, a two-stop gradient
 * and a smooth one, and it has to reject all three. A probe that only passes our
 * own bar checks nothing.
 */
export function checkProfile(stops) {
  // The last stop at a given pixel is the colour that rules from there on.
  const at = (px) => {
    const hit = stops.filter((s) => s.px === px);
    return hit.length ? hit[hit.length - 1].rgb : null;
  };
  const body = luminance(BODY);
  const errs = [];

  const high = at(3);
  if (!high) errs.push("there is no high band at 3px");
  else if (luminance(high) <= body) errs.push("the high band is not lighter than the body");

  if (stops.some((s) => s.px > HIGHLIGHT_PX && s.px < SHADOW_START)) {
    errs.push(`the body is not flat between ${HIGHLIGHT_PX}px and ${SHADOW_START}px`);
  }

  const shadow = [at(SHADOW_START), at(SHADOW_START + 1), at(SHADOW_START + 2)];
  if (shadow.some((c) => !c)) {
    errs.push("the three closing dark rows are missing");
  } else {
    if (luminance(shadow[0]) >= body) {
      errs.push("the shadow does not start darker than the body");
    }
    for (let i = 1; i < shadow.length; i++) {
      if (luminance(shadow[i]) >= luminance(shadow[i - 1])) {
        errs.push(`row ${SHADOW_START + i} does not darken against the previous one`);
      }
    }
  }
  return errs;
}
