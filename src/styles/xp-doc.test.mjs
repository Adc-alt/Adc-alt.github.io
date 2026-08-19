import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const css = readFileSync(new URL("src/styles/xp-doc.css", root), "utf8");

test("the font files the stylesheet asks for are in public/", () => {
  // Nothing else checks a url() inside CSS: rename the file and the page still
  // builds, still passes, and quietly falls back to Tahoma.
  const urls = [...css.matchAll(/url\("(\/[^"]+)"\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 1, `one variable font covers every weight, found ${urls.length}`);
  for (const u of urls) assert.ok(existsSync(new URL(`public${u}`, root)), `${u} is not in public/`);
});

test("nothing in the document is drawn smaller than 13px", () => {
  // The floor, and the one that has already been broken once: the Contact
  // window shipped its address at 0.75rem. Under 13px the secondary text of a
  // window stops being secondary and starts being unreadable, and it is the
  // sizes written as `rem` that get there without looking like they do.
  const sizes = [...css.matchAll(/font-size: ?([^;]+);/g)].map((m) => m[1].trim());
  assert.ok(sizes.length >= 4, "found almost no font sizes — the pattern is wrong");
  for (const s of sizes) {
    // `code` is the one relative size in the file, and 0.9em of 16px is 14.4.
    if (s === "0.9em") continue;
    assert.match(s, /^\d+px$/, `font-size: ${s} — sizes here are written in px`);
    assert.ok(Number(s.replace("px", "")) >= 13, `font-size: ${s} is under the floor`);
  }
});

test("every heading says its own size", () => {
  // ⚠️ The one that shipped and had to be measured in a browser to be seen.
  // Deleting a heading's font-size does not make it inherit the document's 16px
  // — it falls back to the browser's, which is 1.5em for an h2 and 0.67em for
  // an h6, so an h5 lands under the body text. Nothing in the CSS shows it:
  // the wrong size is the one nobody wrote.
  for (const rule of css.split("}")) {
    if (!/^\s*\.xp-doc h[1-6]/m.test(rule)) continue;
    assert.match(rule, /font-size: ?\d+px/, `a heading rule sets no size:\n${rule.trim()}`);
  }
});

test("a document component does not size its own text", () => {
  // The type scale of the documents lives in one file. It was a component that
  // broke it last time: the Contact window drew the address at 0.75rem inside
  // `.xp-doc`, 12px, and no test of the stylesheet could ever have seen it.
  const dir = "src/components/xp/";
  const offenders = readdirSync(new URL(dir, root))
    .filter((n) => n.endsWith(".astro"))
    .filter((n) => readFileSync(new URL(dir + n, root), "utf8").includes('class="xp-doc"'))
    .filter((n) => /font-size:/.test(readFileSync(new URL(dir + n, root), "utf8")));
  assert.deepEqual(offenders, [], "these render a document and size their own text");
});
