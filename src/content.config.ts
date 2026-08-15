import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Each project is a .md in src/content/projects/.
 * The filename is its window id: `hito.md` → #window-project-hito
 *
 * The schema is not decoration: if a project is missing a field, or has a
 * `status` that does not exist, `pnpm build` FAILS. Shipping a half-written
 * window is impossible.
 */
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** One sentence. It is what gets read in the index; make it fit. */
    summary: z.string().max(180),
    year: z.number().int().min(2000).max(2100),
    stack: z.array(z.string()).min(1),
    status: z.enum(["live", "wip", "archived"]),
    /** Order in the index. Lower = earlier. */
    order: z.number().default(99),
    /** Drafts are not published in production. */
    draft: z.boolean().default(false),
    repo: z.url().optional(),
    demo: z.url().optional(),
  }),
});

/**
 * Each blog entry is a .md in src/content/blog/.
 *
 * There is no per-entry URL for now: they all render one after another inside
 * the desktop window, which is a feed. The day there are enough of them, the
 * file `id` already works as a slug without touching anything here.
 */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Publication date. It orders the feed: newest at the top. */
    date: z.date(),
    /** A one-sentence standfirst. Should fit in the window without scrolling. */
    summary: z.string().max(200),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
