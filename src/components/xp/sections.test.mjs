import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  STATUS,
  GAMES,
  GAMES_TITLE,
  GAMES_WINDOW_ID,
  NAV,
  gamePanelId,
  navFor,
  projectSectionId,
  resolveSection,
  sectionId,
} from "./sections.mjs";

const IDS = [
  "section-home",
  "section-experience",
  "section-projects",
  "section-about",
  "section-project-smart-car",
];

test("the Menu is the four entries, in order", () => {
  // Games is NOT one of them: it lives behind the desktop icon, in a window of
  // its own, so the Menu is the portfolio and nothing else. Blog is not one of
  // them either any more; `sections.mjs` says why it went.
  assert.deepEqual(
    NAV.map((n) => n.id),
    ["home", "experience", "projects", "about"],
  );
  assert.deepEqual(
    NAV.map((n) => n.label),
    ["Home", "Experience", "Projects", "About me"],
  );
});

test("every Menu entry points at a distinct section id", () => {
  const ids = NAV.map((n) => sectionId(n.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^section-[a-z-]+$/);
});

test("a project's section id is derived from its filename", () => {
  assert.equal(projectSectionId("smart-car"), "section-project-smart-car");
});

test("a known hash resolves to itself, with or without the #", () => {
  assert.equal(resolveSection(IDS, "#section-about"), "section-about");
  assert.equal(resolveSection(IDS, "section-about"), "section-about");
});

test("an unknown hash falls back to the first section instead of blanking the pane", () => {
  // The failure this prevents: a stale link, a hand-typed hash or a leftover
  // #ventana-perfil from phase 2 hides every section and leaves the middle
  // window empty, with no way to tell it is not just slow.
  assert.equal(resolveSection(IDS, "#section-nope"), "section-home");
  assert.equal(resolveSection(IDS, "#ventana-perfil"), "section-home");
});

test("a window id is not a section id", () => {
  // #window-main is a real element on the page, so `document.getElementById`
  // would have found it. Only the section list counts.
  assert.equal(resolveSection(IDS, "#window-main"), "section-home");
});

test("an empty or missing hash resolves to the first section", () => {
  assert.equal(resolveSection(IDS, ""), "section-home");
  assert.equal(resolveSection(IDS, "#"), "section-home");
  assert.equal(resolveSection(IDS, undefined), "section-home");
  assert.equal(resolveSection(IDS, null), "section-home");
});

test("a project section marks Projects as the current Menu entry", () => {
  assert.equal(navFor("section-project-smart-car"), "section-projects");
});

test("any other section marks itself", () => {
  assert.equal(navFor("section-about"), "section-about");
  assert.equal(navFor("section-projects"), "section-projects");
});

test("a game's panel id is derived from its own id", () => {
  assert.equal(gamePanelId("minesweeper"), "game-minesweeper");
});

test("every game has a distinct panel id, a label and a title for the title bar", () => {
  const ids = GAMES.map((g) => gamePanelId(g.id));
  assert.equal(new Set(ids).size, GAMES.length);
  for (const id of ids) assert.match(id, /^game-[a-z-]+$/);
  for (const game of GAMES) {
    assert.ok(game.label, `${game.id} has no label for the index`);
    assert.ok(game.title, `${game.id} has no title for the title bar`);
  }
});

test("a game panel id is not a section id, so it cannot be mistaken for a hash", () => {
  // The reading pane answers a hash it does not recognise by falling back to
  // Home. If a panel id looked like a section id somebody would link one, and
  // the link would quietly reset the pane behind the Games window.
  for (const game of GAMES) {
    assert.equal(gamePanelId(game.id).startsWith("section-"), false);
    assert.equal(resolveSection(IDS, `#${gamePanelId(game.id)}`), "section-home");
  }
});

test("the Games window has an id of its own and a title", () => {
  assert.equal(GAMES_WINDOW_ID, "window-games");
  assert.equal(GAMES_TITLE, "Games");
  // A window id is not a section id — the pane must not answer to it.
  assert.equal(resolveSection(IDS, `#${GAMES_WINDOW_ID}`), "section-home");
  assert.equal(NAV.some((n) => sectionId(n.id) === GAMES_WINDOW_ID), false);
});

test("every status the schema allows has something to read out", () => {
  // `STATUS[p.data.status]` is an object lookup with no fallback: a status added
  // to the Zod enum and not to the map renders the word `undefined` into the
  // index, and the build stays green because both halves are valid on their own.
  const config = readFileSync(new URL("../../content.config.ts", import.meta.url), "utf8");
  const enumerated = config.match(/status: z\.enum\(\[([^\]]+)\]\)/)[1].match(/"([^"]+)"/g);
  assert.ok(enumerated.length >= 3, "found no status enum — the pattern is wrong");
  for (const quoted of enumerated) {
    const key = quoted.replaceAll('"', "");
    assert.ok(STATUS[key], `status "${key}" is in the schema and has no label`);
  }
  assert.deepEqual(Object.keys(STATUS).sort(), enumerated.map((q) => q.replaceAll('"', "")).sort());
});

test("nothing keeps playing where it cannot be seen", () => {
  // A <video> off the screen keeps its sound, and the pane has no controls left
  // on screen to stop it with. The three ways out of a section are three
  // different attributes — the switcher writes `hidden`, the ✕ writes
  // `data-open`, minimise adds a class — so all three have to be watched.
  const src = readFileSync(new URL("./Sections.astro", import.meta.url), "utf8");
  assert.match(src, /v\.pause\(\)/, "the switcher pauses no video");
  for (const attr of ["hidden", "class", "data-open"]) {
    assert.match(src, new RegExp(`"${attr}"`), `nothing watches ${attr}`);
  }
});

