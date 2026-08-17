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

test("leaving the game destroys the frame rather than hiding it", () => {
  // The reason is audio: a hidden cross-origin frame keeps playing, and this
  // page has no way to reach in and stop it. Only removal stops it.
  assert.match(SCRIPT, /ResizeObserver/);
  assert.match(SCRIPT, /replaceChildren\(button\)/);
});
