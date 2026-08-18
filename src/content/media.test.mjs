import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

/**
 * A `src` or a `poster` in a page is a path nothing checks: the build does not
 * read it, the schema does not know it exists, and a typo ships a 404 that
 * shows up as a black rectangle nobody clicks. This is the check.
 */
const root = new URL("../../", import.meta.url);
const dirs = ["src/content/projects/", "src/content/blog/"];

test("every local file a page points at is in public/", () => {
  const refs = [];
  for (const dir of dirs) {
    for (const name of readdirSync(new URL(dir, root))) {
      if (!name.endsWith(".md")) continue;
      const text = readFileSync(new URL(dir + name, root), "utf8");
      for (const m of text.matchAll(/(?:src|poster)="(\/[^"]+)"/g)) refs.push([dir + name, m[1]]);
    }
  }
  // Guards the guard: a pattern that stopped matching would pass for ever.
  assert.ok(refs.length > 0, "found no local src/poster at all — the pattern is wrong");
  for (const [file, ref] of refs) {
    assert.ok(existsSync(new URL(`public${ref}`, root)), `${file} points at ${ref}, which is not in public/`);
  }
});
