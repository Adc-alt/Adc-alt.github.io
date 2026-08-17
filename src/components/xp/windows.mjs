/**
 * The arithmetic of dragging a window. No DOM on purpose: event handling lives
 * in the <script> of Window.astro, and what is here is only what can go wrong
 * silently and therefore deserves a test.
 */

/**
 * How much of the window must ALWAYS stay inside the desktop, in px.
 *
 * It is not a cosmetic margin: it is what stops the title bar disappearing
 * behind the taskbar or off the screen, leaving the window undraggable for
 * ever, which is the classic failure of a homemade window manager. Windows does
 * the same.
 *
 * Why 110 and not 60, which looks like enough: the three buttons (minimise,
 * maximise, close) take about 70px at the RIGHT end of the title bar. When you
 * push the window left, that end is what stays poking out — that is, buttons
 * only. With 60 the handle you are left with is not a handle: it is a close
 * button. With 110 there are about 40px of actual title bar left, which you can
 * grab.
 */
export const KEEP_VISIBLE = 110;

/**
 * Fits a proposed position inside the desktop.
 *
 * @param {{x:number,y:number,w:number,h:number}} win  proposed position and size
 * @param {{vw:number,vh:number,barH:number}} desk     the available well
 * @returns {{x:number,y:number}} the corrected position
 */
export function clampPosition(win, desk) {
  const { x, y, w } = win;
  const { vw, vh, barH } = desk;

  // The usable height ends where the taskbar starts.
  const bottom = vh - barH;

  // On the left it can go almost all the way out, but not entirely: if the
  // right edge crosses KEEP_VISIBLE there is a handle left to pull it back.
  const minX = KEEP_VISIBLE - w;
  const maxX = vw - KEEP_VISIBLE;

  // At the top nothing goes out: in Windows the title bar never passes the top
  // edge. At the bottom the limit is the taskbar and not the window height: a
  // window taller than the screen still drags.
  const maxY = bottom - KEEP_VISIBLE;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, 0), Math.max(maxY, 0)),
  };
}

/**
 * Initial position: centred horizontally and a little above centre vertically,
 * which is where Windows opens a new window. It goes through the same clamp as
 * dragging, so on a small screen it comes out already fitted.
 */
/**
 * How far down the free height a window opens: above centre, where Windows puts
 * a new window. Shared by `initialPosition` and `rowPositions` so the two
 * cannot drift — a docked window has to sit at the same height as a window that
 * opened on its own, or the row looks like a different kind of thing.
 */
export const ABOVE_CENTRE = 0.4;

export function initialPosition(win, desk) {
  const bottom = desk.vh - desk.barH;
  return clampPosition(
    {
      ...win,
      x: Math.round((desk.vw - win.w) / 2),
      y: Math.round((bottom - win.h) * ABOVE_CENTRE),
    },
    desk,
  );
}

/** Offset between one window and the next, in px. */
export const CASCADE_STEP = 28;

/**
 * How many windows before the cascade wraps back to the start.
 *
 * Without this the sixth window would land outside, the clamp would pull it
 * back, and every window after that would stack at EXACTLY the same spot —
 * which is worse than not cascading at all: they look like a single window.
 */
export const CASCADE_WRAP = 5;

/**
 * Where window number `openCount` opens, counting the ones already open. The
 * first lands on `initialPosition` and each next one steps down and to the
 * right, as in Windows.
 *
 * @param {number} openCount  how many windows are open already
 * @param {{w:number,h:number}} win
 * @param {{vw:number,vh:number,barH:number}} desk
 */
export function cascadePosition(openCount, win, desk) {
  const base = initialPosition(win, desk);
  const step = CASCADE_STEP * (openCount % CASCADE_WRAP);
  return clampPosition({ ...win, x: base.x + step, y: base.y + step }, desk);
}

/**
 * How long the taskbar takes to finish arriving: 400ms waiting plus 400ms
 * rising (phase 1 §8).
 *
 * ⚠️ The two numbers live in the CSS of `Taskbar.astro`. This constant exists so
 * the window sequence can be written against them and a test can hold the order
 * — desktop, then the bar, then the windows — rather than three magic numbers
 * agreeing by luck. Change the bar's timing and change this too.
 */
export const TASKBAR_ENTER_MS = 800;

/** When the first window arrives: just after the bar settles. */
export const ENTER_BASE = TASKBAR_ENTER_MS + 100;

/** The gap between one window arriving and the next. */
export const ENTER_STEP = 260;

/** The animation delay, in ms, for the window at position `order` in the sequence. */
export const enterDelay = (order) => ENTER_BASE + ENTER_STEP * order;

/** Gap between two windows of the row, in px. */
export const ROW_GAP = 16;

/** The least space left at each end of the row, in px. */
export const ROW_MARGIN = 16;

/** The width the row occupies: every window plus one gap between each pair. */
const rowWidth = (sizes) =>
  sizes.reduce((n, s) => n + s.w, 0) + ROW_GAP * Math.max(0, sizes.length - 1);

/**
 * The three windows of the row, left to right: Menu, reading pane, Contact
 * (phase 3 §4).
 *
 * They live here rather than in `index.astro` because the desktop breakpoint is
 * derived from them. Authored somewhere else, a size could change without the
 * breakpoint moving with it — and a breakpoint that does not match the row is
 * exactly the failure this replaced: three windows in a space that cannot hold
 * them, with the two small ones buried inside the reading pane.
 */
export const ROW_SIZES = [
  { w: 200, h: 260 },
  { w: 700, h: 600 },
  { w: 240, h: 300 },
];

/**
 * The narrowest desktop the row fits in: `200 + 700 + 240 + 2×ROW_GAP` for the
 * row itself, plus `2×ROW_MARGIN` for the ends. 1204px today.
 *
 * **Desktop mode means "the row fits".** Below this the three windows cannot be
 * laid out side by side, and the alternative — cascading them — puts the
 * 200-wide Menu and the 240-wide Contact geometrically *inside* the 700-wide
 * reading pane, which is in front. The site would load with its only navigation
 * invisible and unclickable, so the honest line is to fall back to the stacked
 * document instead.
 *
 * ⚠️ CSS `@media` cannot read this, so the literal is repeated in the media
 * queries of `Window.astro` and `XP.astro`. The arithmetic is named in a comment
 * at each of them, and `windows.test.mjs` pins the invariant — the row fits at
 * this width and does not at one pixel less — so the two cannot drift silently.
 */
export const DESKTOP_MIN_WIDTH = rowWidth(ROW_SIZES) + ROW_MARGIN * 2;

/**
 * Lays windows out as one centred row with their tops aligned.
 *
 * Returns `null` when the row plus its margins does not fit, rather than
 * shrinking the windows: a reading pane narrow enough to fit a small laptop is
 * not worth reading. In practice desktop mode is gated on `DESKTOP_MIN_WIDTH`,
 * which is that same arithmetic, so the three row windows never see the `null`;
 * it is the belt to the media query's braces, and what the test asserts against.
 *
 * @param {Array<{w:number,h:number}>} sizes  in row order, left to right
 * @param {{vw:number,vh:number,barH:number}} desk
 * @returns {Array<{x:number,y:number}>|null}
 */
export function rowPositions(sizes, desk) {
  const total = rowWidth(sizes);
  if (total + ROW_MARGIN * 2 > desk.vw) return null;

  const bottom = desk.vh - desk.barH;
  const tallest = Math.max(...sizes.map((s) => s.h));
  // Use the shared ABOVE_CENTRE constant: above centre, where Windows opens a
  // window. Measured off the tallest so the aligned tops stay put whichever
  // window happens to be the tall one.
  const y = Math.round((bottom - tallest) * ABOVE_CENTRE);

  let x = Math.round((desk.vw - total) / 2);
  return sizes.map((s) => {
    // Through the same clamp as dragging. Horizontally it is a no-op if all
    // windows are wider than KEEP_VISIBLE — the row is known to fit — so the
    // gaps survive; vertically it is what keeps a short desktop from putting
    // the title bars under the taskbar.
    const p = clampPosition({ ...s, x, y }, desk);
    x += s.w + ROW_GAP;
    return p;
  });
}
