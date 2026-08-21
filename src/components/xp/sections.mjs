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
 *
 * Experience sits second, above Projects, on purpose. The paid work used to be
 * two paragraphs inside About while three personal projects each had a section
 * of their own with a video in it, and a visitor who skimmed never found out
 * what the job actually is.
 */
export const NAV = [
  { id: "home", label: "Home" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About me" },
  { id: "blog", label: "Blog" },
];

/** A section's element id, which is also its hash. */
export const sectionId = (name) => `section-${name}`;

/** The id of the window the sections live in. Minted by `index.astro`, read by the switcher. */
export const PANE_ID = "window-main";

/** A project's section id, derived from its filename, as phase 2 did for windows. */
export const projectSectionId = (fileId) => sectionId(`project-${fileId}`);

/**
 * The three games, in the order the Games window lists them. Same job as `NAV`:
 * `GamesFolder.astro` renders both the list and a panel per entry out of this
 * array, so a game cannot be listed without existing.
 *
 * `title` is what the window's title bar says while that game is open — the
 * game's own name, not "Games", because that is what Windows put there.
 */
export const GAMES = [
  { id: "minesweeper", label: "Minesweeper", title: "Minesweeper" },
  { id: "solitaire", label: "Solitaire", title: "Solitaire" },
  { id: "pinball", label: "3D Pinball: Space Cadet", title: "3D Pinball for Windows" },
];

/** The window the games live in. Minted by `index.astro`, opened by the desktop icon. */
export const GAMES_WINDOW_ID = "window-games";

/** What the Games window is called when no game is open. */
export const GAMES_TITLE = "Games";

/**
 * Where the song lives. Not a window — the Music shortcut plays it outright —
 * but it still needs an id, because that is how a desktop shortcut finds what
 * it opens.
 */
export const MUSIC_HOST_ID = "music-host";

/**
 * A game panel's element id.
 *
 * Deliberately NOT prefixed `section-`. These are panels inside the Games
 * window, switched by that window's own script; they are not sections of the
 * reading pane and they are not hashes. Sharing the prefix would invite
 * someone to link one, and `resolveSection` does not know these ids — the pane
 * would answer such a link by falling back to Home.
 */
export const gamePanelId = (id) => `game-${id}`;

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
 * A project is reached from Projects and belongs under it, so drilling into one
 * must not leave the Menu with nothing highlighted.
 */
export const navFor = (id) =>
  id.startsWith(sectionId("project-")) ? sectionId("projects") : id;

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
  /* Finished is not Archived: one says the work is done, the other says it is
     parked. A project can be both, and the index only has room for one word. */
  done: "Finished",
  archived: "Archived",
};
