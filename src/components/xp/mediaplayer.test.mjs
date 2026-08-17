import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MUSIC_WINDOW_ID, resolveSection } from "./sections.mjs";

const src = readFileSync(new URL("./MediaPlayer.astro", import.meta.url), "utf8");

test("nothing is fetched from YouTube until the button is pressed", () => {
  // The site's pitch is no analytics and no cookies. An embed that loaded on
  // its own would call Google on every visit, whether or not anyone wanted the
  // song — so the URL sits on the button and becomes an iframe on click.
  assert.match(src, /data-src=\{VIDEO\}/);
  assert.equal(/<iframe/.test(src), false);
  const inMarkup = src.slice(src.indexOf("---", 3));
  assert.equal(/src="https:\/\/www\.youtube/.test(inMarkup), false);
});

test("the frame is destroyed when the window closes, not hidden", () => {
  // A hidden cross-origin iframe keeps playing and cannot be reached into to
  // stop it. Every way out of a window — close, minimise, the taskbar button,
  // another window over it — ends in `display: none`, which a ResizeObserver
  // sees as a 0x0 box.
  assert.match(src, /ResizeObserver/);
  assert.match(src, /width === 0 && box\.height === 0/);
  assert.match(src, /replaceChildren\(button\)/);
});

test("the frame still sends a referrer", () => {
  // YouTube checks who is embedding it and answers "Error 153 — video player
  // configuration error" for a frame that will not say. Verified in a browser:
  // with `referrerPolicy = "no-referrer"` the song never plays.
  assert.equal(/no-referrer/.test(src.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "")), false);
});

test("the player's window id is not a section id", () => {
  // Same reason as the Games window: the reading pane answers a hash it does
  // not know by falling back to Home, so a link to this id would quietly reset
  // the pane behind the player.
  assert.equal(MUSIC_WINDOW_ID, "window-music");
  assert.equal(resolveSection(["section-home", "section-about"], `#${MUSIC_WINDOW_ID}`), "section-home");
});
