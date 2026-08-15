/**
 * The clock in the system tray.
 *
 * A module of its own rather than four lines inside the component because it is
 * the only runtime logic in the phase (§9), and zero-padding is exactly where
 * the bug you see once a day at 9:05 lives.
 */

/** `HH:MM` in 24h, the browser's local time. */
export function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Milliseconds until the next whole minute.
 *
 * The clock reschedules itself with this instead of ticking every second: the
 * tray only shows minutes, so waking up sixty times a minute to paint the same
 * thing is spending battery for nothing. On second zero it returns 60000 and
 * not 0, which would leave the `setTimeout` spinning.
 */
export function msToNextMinute(date) {
  return 60000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}
