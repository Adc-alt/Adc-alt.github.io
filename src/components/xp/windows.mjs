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
