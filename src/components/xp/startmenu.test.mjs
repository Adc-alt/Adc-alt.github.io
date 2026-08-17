import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("./StartMenu.astro", import.meta.url), "utf8");
/* Everything below the frontmatter and above the styles: the part that becomes
   HTML. The frontmatter is TypeScript and the <style> block is CSS, and neither
   can put a control on the page. */
const MARKUP = SRC.split("---").slice(2).join("---").split("<style>")[0];

test("the Start menu has nothing you can click", () => {
  // The requirement, and the only one a future edit is likely to break: it is a
  // picture of XP's Start menu, not a menu. The moment an entry becomes an <a>
  // it starts promising something the panel cannot do, and half of it still
  // will not work.
  for (const tag of ["a", "button", "input", "select", "textarea", "summary"]) {
    const found = new RegExp(`<${tag}[\\s>]`, "i").test(MARKUP);
    assert.equal(found, false, `<${tag}> in the Start menu: it must not be clickable`);
  }
  assert.equal(/\stabindex=/i.test(MARKUP), false, "nothing in the panel may be tabbable");
  assert.equal(/\son[a-z]+=/i.test(MARKUP), false, "no inline handlers");
});

test("the panel is hidden from a screen reader, and hidden to begin with", () => {
  // Both matter. `aria-hidden` because reading out a list of dead entries is
  // worse than silence; `hidden` because the page must not load with the Start
  // menu already open.
  assert.match(MARKUP, /aria-hidden="true"/);
  assert.match(MARKUP, /\n\s*hidden\n/);
});

test("the account is the administrator's", () => {
  assert.match(MARKUP, /Administrator/);
});
