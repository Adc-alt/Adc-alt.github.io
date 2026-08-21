/**
 * The content and timings of the boot screen.
 *
 * It is traced from the first page of https://senna.social/. The timings and
 * the wording are NOT design decisions made here: they are copied values. They
 * live in this file, and not inside the .astro, so that `boot-data.test.mjs`
 * can check them against the reference's table on every build.
 *
 * Measurements and reasons: docs/superpowers/specs/2026-08-14-boot-screen-senna-parity.md
 *
 * ⚠️ Read the spec before touching anything here. Every number has a reason and
 * the test will stop you.
 */

/** The only thing that differs from the reference: who it belongs to. */
export const HEAD = {
  title: "Adc-alt's Portfolio [Version 95.0.218y2k3]",
  copy: "Copyright (c) 2026 ADCSOFT Corporation.",
  mark: "ADC:LAN FUNNY MAN",
};

export const LOADING = "Loading...";

/**
 * The top block. The colons sit inside the label and with different spacing on
 * each line: in the reference it looks hand-typed, and that is how it stays.
 */
export const SPECS = [
  { k: "PROCESSOR MODEL :", v: "Micro-D1-NK" },
  { k: "Memory Testing:", v: "WHAT?" },
  { k: "Dastardly drawings :", v: "91021", unit: "KB", count: true },
];

/**
 * The memory counter. Slow at the start (275ms), flat out in the middle (30ms)
 * and braking at the end (50ms). It runs for about 830ms.
 * `intervals[i]` is the wait AFTER painting `numbers[i]`.
 */
export const COUNT = {
  numbers: [24, 25, 507, 1337, 5678, 9001, 12345, 42069, 80085, 91021],
  intervals: [275, 30, 30, 30, 30, 30, 30, 50, 50, 50],
};

/** The check block: device, dots and verdict. */
export const DEVICES = [
  { k: "Keyboard & Mouse", s: "CONNECTED" },
  { k: "CRT Monitors", s: "PITCHING & WHINING" },
  { k: "LAN Funny Man [22]", s: "ONLINE" },
];

export const TAIL = { k: "CD-ROM inserted :", v: "lego-island-two.pcm" };

export const PROMPT = "[PRESS ANY KEY TO CONTINUE]";

/**
 * Delays in ms from page load, copied from their `textloader.js`.
 *
 * ⚠️ What you see on screen arrives 500ms LATER than these numbers. That is not
 * a mistake in this table: it is the `transition: visibility 0s .5s` in the CSS,
 * which keeps the line hidden while the opacity rises. Spec §5.
 *
 * The two silences are half the character of the screen:
 *  - a full 1.1s between `count` (1900) and `name[0]` (3000).
 *  - 450ms extra on the last verdict (3250 → 3700).
 */
export const T = {
  title: 1000,
  copy: 1200,
  loading: 1400,
  icon: 1600,
  logo: 1800,
  spec: [1600, 1700, 1800],
  count: 1900,
  name: [3000, 3050, 3100],
  verdict: [3200, 3250, 3700],
  tailKey: 3800,
  tailValue: 3900,
  prompt: 4000,
};

/**
 * Milliseconds before it enters the portfolio on its own. **0 = it does not,
 * it waits.**
 *
 * The reference waits for ever: it is still on the boot screen after 25s if you
 * touch nothing, verified. This site does not copy that, and it is the one
 * place it deliberately breaks parity. A boot screen you have to know to click
 * is a door, and everybody arriving here for the first time is somebody with
 * eight tabs open who did not come for a joke about a BIOS.
 *
 * 5200 and not less: `T.prompt` is 4000, what is on screen lands 500ms after
 * its timing, so the last line is legible at 4500. Entering any earlier cuts
 * the sequence with the ONLINE checks, the CD-ROM line or the prompt itself
 * still invisible, which trades one bad first impression for another. 700ms of
 * blinking prompt is the beat that makes it read as an ending.
 *
 * It only costs that once: script 1 writes `boot_seen` and every visit after
 * this one goes straight to the desktop.
 */
export const AUTO_MS = 5200;

/**
 * The same thing for anyone who asked for less motion.
 *
 * With `reduce` every line is painted at once instead of arriving on its
 * timing, so there is no sequence left to finish and 5.2s of waiting is 5.2s
 * of looking at a page that already stopped changing. Long enough to read the
 * screen and notice it is a joke, and then in.
 */
export const AUTO_MS_REDUCED = 1600;
