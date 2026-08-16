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
export function initialPosition(win, desk) {
  const bottom = desk.vh - desk.barH;
  return clampPosition(
    {
      ...win,
      x: Math.round((desk.vw - win.w) / 2),
      y: Math.round((bottom - win.h) * 0.4),
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

/**
 * Lays windows out as one centred row with their tops aligned.
 *
 * Returns `null` when the row plus its margins does not fit: the caller falls
 * back to `cascadePosition`. It gives up instead of shrinking the windows on
 * purpose — a reading pane narrow enough to fit a small laptop is not worth
 * reading, and a cascade is a layout the visitor can fix by dragging.
 *
 * @param {Array<{w:number,h:number}>} sizes  in row order, left to right
 * @param {{vw:number,vh:number,barH:number}} desk
 * @returns {Array<{x:number,y:number}>|null}
 */
export function rowPositions(sizes, desk) {
  const total =
    sizes.reduce((n, s) => n + s.w, 0) + ROW_GAP * Math.max(0, sizes.length - 1);
  if (total + ROW_MARGIN * 2 > desk.vw) return null;

  const bottom = desk.vh - desk.barH;
  const tallest = Math.max(...sizes.map((s) => s.h));
  // The same 0.35 as `initialPosition`: above centre, where Windows opens a
  // window. Measured off the tallest so the aligned tops stay put whichever
  // window happens to be the tall one.
  const y = Math.round((bottom - tallest) * 0.35);

  let x = Math.round((desk.vw - total) / 2);
  return sizes.map((s) => {
    // Through the same clamp as dragging. Horizontally it is a no-op — the row
    // is known to fit — so the gaps survive; vertically it is what keeps a
    // short desktop from putting the title bars under the taskbar.
    const p = clampPosition({ ...s, x, y }, desk);
    x += s.w + ROW_GAP;
    return p;
  });
}
