import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/* Pinball has no rules of its own to test — the game is somebody else's, on
   somebody else's server. What is ours is the frame around it, and everything
   worth protecting there is a promise the source either keeps or quietly
   stops keeping. */
const SRC = readFileSync(new URL("./Pinball.astro", import.meta.url), "utf8");
const FRONTMATTER = SRC.split("---")[1] ?? "";
const MARKUP = SRC.split("---").slice(2).join("---").split("<script>")[0];
const SCRIPT = SRC.split("<script>")[1]?.split("</script>")[0] ?? "";

test("nothing third-party is in the page until you ask for it", () => {
  // The colophon in the Contact window promises that the only host this site
  // talks to is its own. An <iframe> in the markup would break that promise on
  // page load, for every visitor, whether or not they ever open Games.
  assert.equal(/<iframe/i.test(MARKUP), false, "the frame must be built by the script");
  assert.match(SCRIPT, /createElement\("iframe"\)/);
});

test("every live menu command is handled", () => {
  const declared = [...FRONTMATTER.matchAll(/cmd: "([^"]+)"/g)].map((m) => m[1]);
  assert.ok(declared.length >= 3, `only found ${declared.length} commands`);
  for (const cmd of declared) {
    // "exit" is the exception, and on purpose: the window that owns this panel
    // handles it. Every other command is this component's to answer.
    if (cmd === "exit") continue;
    assert.match(SCRIPT, new RegExp(`"${cmd}"`), `menu offers "${cmd}" and nothing does it`);
  }
});

test("the shortcut the menu prints is bound", () => {
  // Drawing a key next to an item does not bind it. This is the pair that
  // drifts: someone renames the command and the key stops working silently.
  assert.match(FRONTMATTER, /key: "F4"/);
  assert.match(SCRIPT, /"F4"/);
});

test("the game runs in a page of ours, not in one of theirs", () => {
  // Everything else about this game depends on it. A frame from another origin
  // cannot be reached into: the music could not be switched off, and full
  // screen was a small game in a corner because the page inside ignored the
  // room it was given.
  assert.match(FRONTMATTER, /const SRC = "\/xp\/pinball\.html"/);
});

test("our loader page carries no game data and does the muting", () => {
  const page = readFileSync(new URL("../../../public/xp/pinball.html", import.meta.url), "utf8");
  // The engine comes from them, over CORS. What must never appear here is the
  // game's own data, which is Microsoft's.
  assert.match(page, /https:\/\/pinball\.alula\.me\/SpaceCadetPinball\.js/);
  assert.match(page, /locateFile/);
  // The music is the two MIDI files and nothing else; the other 60 files in
  // the package are .WAV effects, which the owner asked to keep. Run the
  // page's own pattern against real names from the package: widen it by
  // accident and the effects are blanked too.
  const literal = page.match(/const MUSIC_FILE = \/(.+)\/([a-z]*);/);
  assert.ok(literal, "no MUSIC_FILE pattern in the loader page");
  const music = new RegExp(literal[1], literal[2]);
  assert.equal(music.test("/game_resources/PINBALL.MID"), true);
  assert.equal(music.test("/game_resources/PINBALL2.MID"), true);
  assert.equal(music.test("/game_resources/SOUND29.WAV"), false);
  assert.equal(music.test("/game_resources/PINBALL.DAT"), false);
  // It has to be an accessor: the engine's loader assigns this property during
  // startup, so a plain function here is overwritten and the music comes back.
  assert.match(page, /Object\.defineProperty\(window\.Module, "FS_createDataFile"/);
  assert.match(page, /\bset:/);
  assert.match(page, /\bget:/);
  // No timer may decide whether the music plays. The click this replaced fired
  // 700ms after startup and simply missed on a slow machine.
  assert.equal(/setTimeout\(\s*killMusic/.test(page), false);
});

test("leaving the game destroys the frame rather than hiding it", () => {
  // The reason is audio: a hidden cross-origin frame keeps playing, and this
  // page has no way to reach in and stop it. Only removal stops it.
  assert.match(SCRIPT, /ResizeObserver/);
  assert.match(SCRIPT, /replaceChildren\(button\)/);
});
