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
];

/** A section's element id, which is also its hash. */
export const sectionId = (name) => `section-${name}`;

/** A project's section id, derived from its filename, as phase 2 did for windows. */
export const projectSectionId = (fileId) => sectionId(`project-${fileId}`);

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
  archived: "Archived",
};
