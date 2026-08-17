import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GAMES,
  NAV,
  gameSectionId,
  navFor,
  projectSectionId,
  resolveSection,
  sectionId,
} from "./sections.mjs";

const IDS = [
  "section-home",
  "section-projects",
  "section-about",
  "section-blog",
  "section-games",
  "section-project-this-desktop",
  "section-game-minesweeper",
];

test("the Menu is the five entries the spec names, in order", () => {
  assert.deepEqual(
    NAV.map((n) => n.id),
    ["home", "projects", "about", "blog", "games"],
  );
  assert.deepEqual(
    NAV.map((n) => n.label),
    ["Home", "Projects", "About me", "Blog", "Games"],
  );
});

test("every Menu entry points at a distinct section id", () => {
  const ids = NAV.map((n) => sectionId(n.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^section-[a-z-]+$/);
});

test("a project's section id is derived from its filename", () => {
  assert.equal(projectSectionId("this-desktop"), "section-project-this-desktop");
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
  assert.equal(navFor("section-project-this-desktop"), "section-projects");
});

test("a game section marks Games as the current Menu entry", () => {
  // Otherwise opening a game leaves the Menu with nothing highlighted and no
  // clue where you are.
  assert.equal(navFor("section-game-minesweeper"), "section-games");
  assert.equal(navFor("section-game-pinball"), "section-games");
});

test("any other section marks itself", () => {
  assert.equal(navFor("section-about"), "section-about");
  assert.equal(navFor("section-projects"), "section-projects");
  assert.equal(navFor("section-games"), "section-games");
});

test("a game's section id is derived from its own id", () => {
  assert.equal(gameSectionId("minesweeper"), "section-game-minesweeper");
});

test("every game has a distinct section id and a title for the title bar", () => {
  const ids = GAMES.map((g) => gameSectionId(g.id));
  assert.equal(new Set(ids).size, GAMES.length);
  for (const id of ids) assert.match(id, /^section-game-[a-z-]+$/);
  for (const game of GAMES) {
    assert.ok(game.label, `${game.id} has no label for the index`);
    assert.ok(game.title, `${game.id} has no title for the title bar`);
  }
});

test("no game collides with a Menu entry's section", () => {
  // Both lists mint ids into the same namespace, and a collision would render
  // two sections with the same id — the switcher would only ever find one.
  const nav = NAV.map((n) => sectionId(n.id));
  for (const game of GAMES) assert.equal(nav.includes(gameSectionId(game.id)), false);
});

test("a game hash resolves to that game and not to the index", () => {
  assert.equal(resolveSection(IDS, "#section-game-minesweeper"), "section-game-minesweeper");
});
