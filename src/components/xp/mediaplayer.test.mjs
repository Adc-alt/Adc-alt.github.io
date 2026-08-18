import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MUSIC_HOST_ID, resolveSection } from "./sections.mjs";

const src = readFileSync(new URL("./MediaPlayer.astro", import.meta.url), "utf8");
const markup = src.slice(src.indexOf("---", 3));

test("nothing is fetched from YouTube until the shortcut is used", () => {
  // The site's pitch is no analytics and no cookies. An embed sitting in the
  // markup would call Google on every visit, whether or not anyone wanted the
  // song — so the URL waits on the host and becomes an iframe on demand.
  assert.match(src, /data-src=\{VIDEO\}/);
  assert.equal(/<iframe/.test(markup), false);
  assert.equal(/src="https:\/\/www\.youtube/.test(markup), false);
});

test("the host is moved off screen, never undisplayed", () => {
  // ⚠️ The one that breaks silently. A frame inside `display: none` — or inside
  // an element carrying `hidden` — is not loaded, so the song simply never
  // plays and the shortcut looks broken. Off screen it plays.
  const css = src.slice(src.indexOf("<style>"));
  assert.match(css, /position: fixed/);
  assert.match(css, /left: -\d{4,}px/);
  assert.equal(/display:\s*none/.test(css), false);
  assert.equal(/<div id=\{MUSIC_HOST_ID\}[^>]*\shidden/.test(markup), false);
});

test("pressing the shortcut again stops the song", () => {
  // There is no window and no player, so this is the only way to stop it. Drop
  // the branch and the song runs until the tab is closed.
  assert.match(src, /host\.firstChild/);
  assert.match(src, /host\.replaceChildren\(\)/);
});

test("the frame still sends a referrer", () => {
  // YouTube checks who is embedding it and answers "Error 153 — video player
  // configuration error" to a frame that will not say. Verified in a browser:
  // with `referrerPolicy = "no-referrer"` the song never plays.
  const code = src.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  assert.equal(/no-referrer/.test(code), false);
});

test("the host's id is not a section id", () => {
  // The reading pane answers a hash it does not know by falling back to Home,
  // so a link to this id would quietly reset the pane.
  assert.equal(MUSIC_HOST_ID, "music-host");
  assert.equal(resolveSection(["section-home", "section-about"], `#${MUSIC_HOST_ID}`), "section-home");
});
