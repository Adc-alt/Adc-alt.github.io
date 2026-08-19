import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The em dash is a tell. It is not a character the owner of this site types,
 * it is one a language model reaches for, and prose full of them reads as
 * written by a machine no matter how true it is. Nothing a visitor can read
 * gets to have one: a comma, a colon, a pair of brackets or a full stop says
 * the same thing and does not announce where the sentence came from.
 *
 * Only the visible half of each file is searched. Source comments are not
 * published prose, so they are cut out first, along with the style and script
 * blocks of a component. What is left of an .astro file is its markup AND its
 * frontmatter code, on purpose: the page title is built out of a template
 * literal up there, and it is as visible as any paragraph.
 *
 * The README is in scope too. It is not on the site, but it is the first thing
 * anyone reads on the GitHub page, which is the other half of a portfolio.
 * Comments inside components are NOT in scope and still have plenty.
 */
const ROOT = new URL("./", import.meta.url);
const DASHES = /[—–]/;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : [new URL(e.name, dir)],
  );

const visible = (src, isAstro) =>
  (isAstro
    ? src.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<script[\s\S]*?<\/script>/g, "")
    : src
  )
    /* Block comments cover both JSDoc in the frontmatter and the {/* ... *[/]}
       form Astro uses inside markup. */
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Line comments, but not the // inside a URL, which would swallow the rest
    // of a line of real prose along with it.
    .replace(/(?<![:/])\/\/.*$/gm, "");

test("no em dash reaches the screen", () => {
  const files = walk(ROOT).filter((u) => /\.(astro|md)$/.test(u.pathname));
  files.push(new URL("../README.md", import.meta.url));
  // Guards the guard: a walk that stopped finding files would pass for ever.
  assert.ok(files.length > 15, `only found ${files.length} pages, the walk is wrong`);

  const found = [];
  for (const url of files) {
    const path = fileURLToPath(url);
    const isAstro = path.endsWith(".astro");
    visible(readFileSync(path, "utf8"), isAstro)
      .split("\n")
      .forEach((line, i) => {
        if (DASHES.test(line)) found.push(`${path.split(/\/(?=src\/|README)/).pop()}:${i + 1}  ${line.trim()}`);
      });
  }
  assert.deepEqual(found, [], `\n${found.join("\n")}\n`);
});
