/**
 * The sections of the middle window, and the arithmetic of choosing one.
 *
 * No DOM on purpose: the switcher lives in the <script> of Sections.astro, and
 * what is here is the part that can go wrong silently — a hash nobody
 * recognises leaving the reading pane blank, or the Menu drifting out of step
 * with what actually got rendered.
 */

/**
 * The Menu, in order. It is the single source of truth: `Sections.astro`
 * renders the fixed sections from this list and `Nav.astro` renders the links
 * from it, so a typo cannot put a Menu entry in front of a section that does
 * not exist.
 */
export const NAV = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About me" },
  { id: "blog", label: "Blog" },
  { id: "games", label: "Games" },
];

/** A section's element id, which is also its hash. */
export const sectionId = (name) => `section-${name}`;

/** The id of the window the sections live in. Minted by `index.astro`, read by the switcher. */
export const PANE_ID = "window-main";

/** A project's section id, derived from its filename, as phase 2 did for windows. */
export const projectSectionId = (fileId) => sectionId(`project-${fileId}`);

/**
 * The three games, in the order the Games index lists them. Same job as `NAV`:
 * `Sections.astro` renders a section per entry and `Games.astro` renders the
 * links, so a game cannot be listed without existing.
 *
 * `title` is what the pane's title bar says while the game is open — the game's
 * own name, not "Games", because that is what Windows put there.
 */
export const GAMES = [
  { id: "minesweeper", label: "Minesweeper", title: "Minesweeper" },
  { id: "solitaire", label: "Solitaire", title: "Solitaire" },
  { id: "pinball", label: "3D Pinball: Space Cadet", title: "3D Pinball for Windows" },
];

/** A game's section id. Parallel to `projectSectionId` and for the same reason. */
export const gameSectionId = (id) => sectionId(`game-${id}`);

/**
 * Which section a hash asks for, guaranteed to be one that exists.
 *
 * Anything unrecognised — a stale link, a typo, a leftover `#ventana-perfil`
 * from phase 2, or the id of a window rather than a section — falls back to the
 * first section. Without this the switcher hides all of them and the middle
 * window is blank, which reads as a broken site rather than a bad link.
 */
export function resolveSection(ids, hash) {
  const wanted = String(hash ?? "").replace(/^#/, "");
  return ids.includes(wanted) ? wanted : ids[0];
}

/**
 * Which Menu entry is the current one for a given section.
 *
 * A project is reached from Projects and belongs under it, and a game from
 * Games, so drilling into either must not leave the Menu with nothing
 * highlighted.
 */
export function navFor(id) {
  if (id.startsWith(sectionId("project-"))) return sectionId("projects");
  if (id.startsWith(sectionId("game-"))) return sectionId("games");
  return id;
}

/**
 * How each `status` from the content schema reads.
 *
 * It used to live in `projects.mjs`, whose stated reason for existing was
 * keeping a window id from drifting between the page that minted it and the
 * index that linked it. Phase 3 has no per-project window, so that module has
 * nothing left to hold and Task 4 deletes it.
 */
export const STATUS = {
  live: "In use",
  wip: "In progress",
  archived: "Archived",
};
