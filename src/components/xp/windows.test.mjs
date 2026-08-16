import { test } from "node:test";
import assert from "node:assert/strict";
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

// The three windows of phase 3, in Menu / Main / Contact order.
const ROW = [
  { w: 200, h: 260 },
  { w: 700, h: 600 },
  { w: 240, h: 300 },
];

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
  const p = rowPositions(ROW, DESK);
  assert.ok(p, "the row should fit at 1440x900");
  assert.equal(p[1].x - (p[0].x + ROW[0].w), ROW_GAP);
  assert.equal(p[2].x - (p[1].x + ROW[1].w), ROW_GAP);
});

test("the row is centred and its tops are aligned", () => {
  const p = rowPositions(ROW, DESK);
  const left = p[0].x;
  const right = DESK.vw - (p[2].x + ROW[2].w);
  assert.ok(Math.abs(left - right) <= 1, `left=${left} right=${right}`);
  assert.equal(p[0].y, p[1].y);
  assert.equal(p[1].y, p[2].y);
});

test("the row sits above centre, like a window Windows just opened", () => {
  const p = rowPositions(ROW, DESK);
  const tallest = Math.max(...ROW.map((s) => s.h));
  assert.ok(p[0].y < (DESK.vh - DESK.barH - tallest) / 2, `y=${p[0].y}`);
});

test("the row gives up rather than squeezing, and says so with null", () => {
  // The caller falls back to cascadePosition. Shrinking the windows to fit
  // would leave a reading pane too narrow to read, which is worse.
  assert.equal(rowPositions(ROW, { vw: 900, vh: 900, barH: 40 }), null);
});

test("the threshold is the row plus one margin each side, to the pixel", () => {
  const total = ROW.reduce((n, s) => n + s.w, 0) + ROW_GAP * (ROW.length - 1);
  const min = total + ROW_MARGIN * 2;
  assert.ok(rowPositions(ROW, { vw: min, vh: 900, barH: 40 }), `should fit at ${min}`);
  assert.equal(rowPositions(ROW, { vw: min - 1, vh: 900, barH: 40 }), null);
});

test("on a short desktop the row still lands inside the clamp", () => {
  const short = { vw: 1440, vh: 420, barH: 40 };
  const p = rowPositions(ROW, short);
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
