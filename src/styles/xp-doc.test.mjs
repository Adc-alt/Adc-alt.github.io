import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const css = readFileSync(new URL("src/styles/xp-doc.css", root), "utf8");

test("the font files the stylesheet asks for are in public/", () => {
  // Nothing else checks a url() inside CSS: rename the file and the page still
  // builds, still passes, and quietly falls back to Tahoma.
  const urls = [...css.matchAll(/url\("(\/[^"]+)"\)/g)].map((m) => m[1]);
  assert.equal(urls.length, 2, `expected the regular and the bold, found ${urls.length}`);
  for (const u of urls) assert.ok(existsSync(new URL(`public${u}`, root)), `${u} is not in public/`);
});

test("every size in the document is one the pixel font can draw", () => {
  // ⚠️ Pixel Operator's em is 1600 units on a grid of 100, so it is exact at
  // 16px and at 32 and 48, and at nothing else. A 0.9rem that reads as harmless
  // is 14.4px, and a pixel font at 14.4px is a blurred pixel font.
  const sizes = [...css.matchAll(/font-size: ?([^;]+);/g)].map((m) => m[1].trim());
  assert.ok(sizes.length >= 2, "found no font sizes at all — the pattern is wrong");
  for (const s of sizes) {
    // `code` is the one exception in the file and it is not this font: it is
    // Courier New, which has no grid to land on.
    if (s === "0.9em") continue;
    const px = Number(s.replace("px", ""));
    assert.ok(s.endsWith("px") && px % 16 === 0, `font-size: ${s} is not a multiple of 16px`);
  }
});

test("every heading says its own size", () => {
  // ⚠️ The one that shipped and had to be measured in a browser to be seen.
  // Deleting a heading's font-size does not make it inherit the document's 16px
  // — it falls back to the browser's, which is 1.5em for an h2 and 0.67em for
  // an h6. Nothing in the CSS shows it: the wrong size is the one nobody wrote.
  for (const rule of css.split("}")) {
    if (!/^\s*\.xp-doc h[1-6]/m.test(rule)) continue;
    assert.match(rule, /font-size: ?\d+px/, `a heading rule sets no size:\n${rule.trim()}`);
  }
});

test("a document component does not size its own text", () => {
  // The same trap one file over, and the one that actually shipped: the Contact
  // window drew the address at 0.75rem inside `.xp-doc`, which is 12px.
  const dir = "src/components/xp/";
  const offenders = readdirSync(new URL(dir, root))
    .filter((n) => n.endsWith(".astro"))
    .filter((n) => readFileSync(new URL(dir + n, root), "utf8").includes('class="xp-doc"'))
    .filter((n) => /font-size:/.test(readFileSync(new URL(dir + n, root), "utf8")));
  assert.deepEqual(offenders, [], "these render a document and size their own text");
});
