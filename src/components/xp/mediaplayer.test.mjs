import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { MUSIC_HOST_ID, resolveSection } from "./sections.mjs";

const src = readFileSync(new URL("./MediaPlayer.astro", import.meta.url), "utf8");
const markup = src.slice(src.indexOf("---", 3));
// The file EXPLAINS the YouTube embed at length, so the prose has to be taken
// out before asking whether the embed is still here.
const code = markup.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, "").replace(/\/\/[^\n]*/g, "");

test("the song is served from this site and nothing is framed", () => {
  // ⚠️ The bug this replaced: a YouTube embed answers a double click with an
  // advert, and there is no parameter that turns adverts off. Going back to an
  // iframe brings the adverts back with it — and off screen, where the Skip
  // button cannot be pressed, which is what made it unbearable rather than
  // merely rude.
  assert.match(code, /<audio[^>]*\ssrc="\/media\/music\.mp3"/);
  assert.equal(/<iframe|youtube/i.test(code), false, "the embed is back");
});

test("not one byte of the song is fetched until it is asked for", () => {
  // The pitch is a page that talks to nobody and costs nothing to look at. The
  // file is 2.5MB; without this attribute every visitor downloads it, whether
  // or not they ever press the shortcut.
  assert.match(code, /preload="none"/);
  const size = statSync(new URL("../../../public/media/music.mp3", import.meta.url)).size;
  assert.ok(size > 1e6, `the song is ${size} bytes — that is not the song`);
});

test("pressing the shortcut again stops the song and rewinds it", () => {
  // There is no player and no position indicator, so a second press that
  // resumed from the middle would look broken. Drop the branch entirely and the
  // song cannot be stopped at all.
  assert.match(code, /audio\.pause\(\)/);
  assert.match(code, /audio\.currentTime = 0/);
});

test("the host's id is not a section id", () => {
  // The reading pane answers a hash it does not know by falling back to Home,
  // so a link to this id would quietly reset the pane.
  assert.equal(MUSIC_HOST_ID, "music-host");
  assert.equal(resolveSection(["section-home", "section-about"], `#${MUSIC_HOST_ID}`), "section-home");
});
