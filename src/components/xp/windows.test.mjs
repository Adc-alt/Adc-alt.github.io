import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  cascadePosition,
  clampPosition,
  initialPosition,
  enterDelay,
  rowPositions,
  CASCADE_STEP,
  CASCADE_WRAP,
  ENTER_BASE,
  ENTER_STEP,
  KEEP_VISIBLE,
  ROW_GAP,
  ROW_MARGIN,
  ROW_SIZES,
  DESKTOP_MIN_WIDTH,
  TASKBAR_ENTER_MS,
} from "./windows.mjs";

// Reference desktop: 1440x900 with the 40px bar.
const DESK = { vw: 1440, vh: 900, barH: 40 };
const WIN = { w: 720, h: 520 };

test("a position that already fits is left alone", () => {
  const p = clampPosition({ ...WIN, x: 300, y: 100 }, DESK);
  assert.deepEqual(p, { x: 300, y: 100 });
});

test("the window cannot be pushed entirely off the left edge", () => {
  const p = clampPosition({ ...WIN, x: -5000, y: 100 }, DESK);
  // KEEP_VISIBLE px of window are left poking out of the left edge.
  assert.equal(p.x + WIN.w, KEEP_VISIBLE);
});

test("what pokes out on the left includes title bar, not just buttons", () => {
  // The three buttons live flush against the right edge of the title bar and
  // take ~70px. If KEEP_VISIBLE dropped below that, pushing the window left
  // would leave nothing but buttons showing and the window could never be
  // dragged back. Measured in the DOM with Chrome.
  const BUTTONS_WIDTH = 70;
  assert.ok(
    KEEP_VISIBLE - BUTTONS_WIDTH >= 30,
    `only ${KEEP_VISIBLE - BUTTONS_WIDTH}px are grabbable`,
  );
});

test("nor off the right edge", () => {
  const p = clampPosition({ ...WIN, x: 5000, y: 100 }, DESK);
  assert.equal(p.x, DESK.vw - KEEP_VISIBLE);
});

test("the title bar never goes above the top edge", () => {
  const p = clampPosition({ ...WIN, x: 300, y: -400 }, DESK);
  assert.equal(p.y, 0);
});

test("the title bar never hides behind the taskbar", () => {
  const p = clampPosition({ ...WIN, x: 300, y: 5000 }, DESK);
  // The bottom limit is set by the taskbar, not by the window height.
  assert.equal(p.y, DESK.vh - DESK.barH - KEEP_VISIBLE);
  assert.ok(p.y + KEEP_VISIBLE <= DESK.vh - DESK.barH);
});

test("a window taller than the screen can still be dragged", () => {
  // The bug this clamp avoids: if the bottom limit were `bottom - h`, with
  // h > bottom it would come out negative, the clamp would fight it against the
  // 0 at the top and the window would be stuck.
  const tall = { w: 720, h: 5000 };
  const p = clampPosition({ ...tall, x: 300, y: 200 }, DESK);
  assert.equal(p.y, 200);
});

test("on a tiny screen the position is still valid", () => {
  const phone = { vw: 360, vh: 640, barH: 40 };
  const p = initialPosition({ w: 720, h: 520 }, phone);
  assert.ok(p.x <= phone.vw - KEEP_VISIBLE, `x=${p.x}`);
  assert.ok(p.y >= 0, `y=${p.y}`);
  assert.ok(p.y <= phone.vh - phone.barH - KEEP_VISIBLE, `y=${p.y}`);
});

test("the initial position centres horizontally", () => {
  const p = initialPosition(WIN, DESK);
  assert.equal(p.x, (DESK.vw - WIN.w) / 2);
  // Above centre, like Windows opens them: less than half the well.
  assert.ok(p.y < (DESK.vh - DESK.barH - WIN.h) / 2, `y=${p.y}`);
});

test("the first window of the cascade lands on the initial position", () => {
  assert.deepEqual(cascadePosition(0, WIN, DESK), initialPosition(WIN, DESK));
});

test("each window of the cascade steps once from the previous one", () => {
  const a = cascadePosition(1, WIN, DESK);
  const b = cascadePosition(2, WIN, DESK);
  assert.equal(b.x - a.x, CASCADE_STEP);
  assert.equal(b.y - a.y, CASCADE_STEP);
});

test("the cascade wraps instead of stacking on the same spot", () => {
  // The bug this avoids: without the wrap, the clamp ends up leaving every
  // window from the sixth onwards on identical pixels.
  assert.deepEqual(cascadePosition(CASCADE_WRAP, WIN, DESK), cascadePosition(0, WIN, DESK));
  assert.notDeepEqual(cascadePosition(CASCADE_WRAP - 1, WIN, DESK), cascadePosition(0, WIN, DESK));
});

test("no window of the cascade falls off the desktop", () => {
  // A small screen on purpose: that is where the cascade pushes things out.
  const small = { vw: 900, vh: 600, barH: 40 };
  for (let i = 0; i < CASCADE_WRAP * 2; i++) {
    const p = cascadePosition(i, WIN, small);
    assert.ok(p.x >= KEEP_VISIBLE - WIN.w && p.x <= small.vw - KEEP_VISIBLE, `i=${i} x=${p.x}`);
    assert.ok(p.y >= 0 && p.y <= small.vh - small.barH - KEEP_VISIBLE, `i=${i} y=${p.y}`);
  }
});

test("the first window waits for the taskbar to finish rising", () => {
  // The whole point of the sequence: desktop, then the bar, then the windows.
  // If the first window overlaps the bar's 800ms rise they arrive together and
  // it reads as an image instead of a machine starting up (phase 1 §8).
  assert.ok(enterDelay(0) > TASKBAR_ENTER_MS, `${enterDelay(0)} <= ${TASKBAR_ENTER_MS}`);
  assert.equal(enterDelay(0), ENTER_BASE);
});

test("each window in the sequence waits one step longer than the last", () => {
  assert.equal(enterDelay(1) - enterDelay(0), ENTER_STEP);
  assert.equal(enterDelay(2) - enterDelay(1), ENTER_STEP);
  for (let i = 1; i < 6; i++) {
    assert.ok(enterDelay(i) > enterDelay(i - 1), `i=${i}`);
  }
});

test("the row lays the three windows out with an exact gap between them", () => {
  const p = rowPositions(ROW_SIZES, DESK);
  assert.ok(p, "the row should fit at 1440x900");
  assert.equal(p[1].x - (p[0].x + ROW_SIZES[0].w), ROW_GAP);
  assert.equal(p[2].x - (p[1].x + ROW_SIZES[1].w), ROW_GAP);
});

test("the row is centred and its tops are aligned", () => {
  const p = rowPositions(ROW_SIZES, DESK);
  const left = p[0].x;
  const right = DESK.vw - (p[2].x + ROW_SIZES[2].w);
  assert.ok(Math.abs(left - right) <= 1, `left=${left} right=${right}`);
  assert.equal(p[0].y, p[1].y);
  assert.equal(p[1].y, p[2].y);
});

test("the row sits above centre, like a window Windows just opened", () => {
  const p = rowPositions(ROW_SIZES, DESK);
  const tallest = Math.max(...ROW_SIZES.map((s) => s.h));
  // The invariant the shared ABOVE_CENTRE constant exists for: a window of
  // the tallest height, opened on its own, lands at the same height as the row.
  // This was previously checked only by the weak assertion below, which passes
  // for any coefficient under 0.5 — including the now-fixed 0.4 that was being
  // claimed as 0.35.
  // Off ROW_SIZES and not a literal pair: the reading pane has been resized
  // twice now, and a hardcoded 700x600 here fails for the wrong reason.
  const solo = initialPosition({ w: ROW_SIZES[1].w, h: tallest }, DESK);
  assert.equal(p[0].y, solo.y, `row y should match a solo window of tallest height`);
  assert.equal(p[0].y, 88, `at 1440x900 with barH 40 and tallest ${tallest}`);
  assert.ok(p[0].y < (DESK.vh - DESK.barH - tallest) / 2, `y=${p[0].y}`);
});

test("the row gives up rather than squeezing, and says so with null", () => {
  // The caller falls back to cascadePosition. Shrinking the windows to fit
  // would leave a reading pane too narrow to read, which is worse.
  assert.equal(rowPositions(ROW_SIZES, { vw: 900, vh: 900, barH: 40 }), null);
});

test("the threshold is the row plus one margin each side, to the pixel", () => {
  const total = ROW_SIZES.reduce((n, s) => n + s.w, 0) + ROW_GAP * (ROW_SIZES.length - 1);
  const min = total + ROW_MARGIN * 2;
  assert.ok(rowPositions(ROW_SIZES, { vw: min, vh: 900, barH: 40 }), `should fit at ${min}`);
  assert.equal(rowPositions(ROW_SIZES, { vw: min - 1, vh: 900, barH: 40 }), null);
});

test("the desktop breakpoint is exactly where the row starts fitting", () => {
  // The invariant, not the number: desktop mode means "the row fits", so
  // DESKTOP_MIN_WIDTH must sit on the exact pixel where rowPositions stops
  // returning null.
  //
  // ⚠️ This half is a closed loop — DESKTOP_MIN_WIDTH is derived from the same
  // ROW_SIZES that rowPositions measures, so it cannot fail. It documents the
  // relation. The test that can actually fail is the next one, which reads the
  // CSS.
  //
  // What breaks without this: below the breakpoint the three windows cascade,
  // and the cascade centres each of them for its OWN width, which puts the
  // 200-wide Menu and the 240-wide Contact entirely inside the 700-wide
  // reading pane — and the pane is in front. The site loads with its only
  // navigation invisible and unclickable.
  const desk = (vw) => ({ vw, vh: 900, barH: 40 });
  assert.ok(
    rowPositions(ROW_SIZES, desk(DESKTOP_MIN_WIDTH)),
    `the row must fit at DESKTOP_MIN_WIDTH (${DESKTOP_MIN_WIDTH})`,
  );
  assert.equal(
    rowPositions(ROW_SIZES, desk(DESKTOP_MIN_WIDTH - 1)),
    null,
    `the row must NOT fit one pixel below DESKTOP_MIN_WIDTH`,
  );
});

test("the CSS media queries spell out the same breakpoint as the code", () => {
  // The one that bites. CSS cannot read a JS constant, so `@media (min-width:
  // 1204px)` is a literal in two files, and the derived constant on its own
  // protects nothing: change a window's size and DESKTOP_MIN_WIDTH follows
  // while the two literals stay where they were. Then the media query turns the
  // desktop on at a width where the row no longer fits, the windows cascade,
  // and the cascade centres each of them for its OWN width — which puts the
  // Menu and Contact entirely inside the reading pane, in front of them. The
  // site loads with its only navigation invisible and unclickable. That is a
  // bug this branch actually shipped and had to fix.
  //
  // So the test reads the files. Grepping source in a unit test is ugly; it is
  // the only thing here that catches the drift.
  const files = ["../../layouts/XP.astro", "./Window.astro"];
  for (const rel of files) {
    const css = readFileSync(new URL(rel, import.meta.url), "utf8");
    const found = [...css.matchAll(/@media \(min-width: (\d+)px\)/g)].map((m) => Number(m[1]));
    assert.ok(found.length > 0, `${rel} should carry a desktop media query`);
    for (const px of found) {
      assert.equal(
        px,
        DESKTOP_MIN_WIDTH,
        `${rel}: @media (min-width: ${px}px) but DESKTOP_MIN_WIDTH is ${DESKTOP_MIN_WIDTH}`,
      );
    }
  }
});

test("on a short desktop the row still lands inside the clamp", () => {
  const short = { vw: 1440, vh: 420, barH: 40 };
  const p = rowPositions(ROW_SIZES, short);
  assert.ok(p, "the row fits horizontally");
  for (const q of p) {
    assert.ok(q.y >= 0, `y=${q.y}`);
    assert.ok(q.y <= short.vh - short.barH - KEEP_VISIBLE, `y=${q.y}`);
  }
});

test("a row of one is just a centred window", () => {
  const p = rowPositions([{ w: 700, h: 600 }], DESK);
  assert.equal(p.length, 1);
  assert.equal(p[0].x, (DESK.vw - 700) / 2);
});
