/**
 * The little that the project index, each project window and the page that
 * mounts them have in common.
 *
 * It exists for one concrete reason: the window `id` is minted by `index.astro`
 * and linked by `Projects.astro`. If each composes it its own way, the link
 * stops opening the window and **the build does not fail** — it ships broken.
 * With a function, either both agree or neither compiles.
 */

/** A project's window id, derived from its filename. */
export const windowIdFor = (id) => `window-project-${id}`;

/** How each `status` from the schema reads. */
export const STATUS = {
  live: "In use",
  wip: "In progress",
  archived: "Archived",
};
