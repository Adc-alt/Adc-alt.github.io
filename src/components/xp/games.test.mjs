import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Two files that only agree by name. Neither of these is a function anything
   can import: they are an event dispatched in one component and listened for
   in another, and a rename on one side is silent on the other — no error, just
   a folder that quietly stops resetting. */
const WINDOW = readFileSync(new URL("./Window.astro", import.meta.url), "utf8");
const FOLDER = readFileSync(new URL("./GamesFolder.astro", import.meta.url), "utf8");

test("closing the window says so, and the folder is listening", () => {
  // Press the X on an open game and the folder must forget it: reopening on
  // the game you closed hides the other two, which is what the owner reported.
  assert.match(WINDOW, /dispatchEvent\(new CustomEvent\("xp:close"\)\)/);
  assert.match(FOLDER, /addEventListener\("xp:close"/);
});

test("a resize recentres the window rather than clamping it", () => {
  // A game opens in the middle of the screen. Left on `reclamp` the window
  // grows out of wherever it was dragged to, and 600px of Pinball starting at
  // the right-hand edge is mostly off the screen.
  assert.match(WINDOW, /initialPosition\(\{ w: win\.offsetWidth, h: win\.offsetHeight \}, desk\(\)\)/);
  assert.match(WINDOW, /import \{[^}]*initialPosition/s);
  // The other half: a closed window has no box, so it cannot be centred then —
  // the folder asks again the moment it is shown.
  assert.match(FOLDER, /addEventListener\("xp:show", \(\) => queueMicrotask\(fit\)\)/);
});
