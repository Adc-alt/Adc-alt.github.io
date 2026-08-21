import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Each project is a .md in src/content/projects/.
 * The filename is its section id: `my-project.md` → #section-project-my-project
 *
 * The schema is not decoration: if a project is missing a field, or has a
 * `status` that does not exist, `pnpm build` FAILS. Shipping a half-written
 * section is impossible.
 */
const projects = defineCollection({
  loader: glob({ base: "./src/content/projects", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** One sentence. It is what gets read in the index; make it fit. */
    summary: z.string().max(180),
    year: z.number().int().min(2000).max(2100),
    stack: z.array(z.string()).min(1),
    status: z.enum(["live", "wip", "done", "archived"]),
    /**
     * The picture in the index, beside the title. `/media/cover-<id>.jpg|png`,
     * and 4:3 — the index box does no cropping, so a cover that is not 4:3 is
     * a cover drawn the wrong shape. Optional: a project with no photograph
     * worth showing lists as text, which is what every one of them did until
     * there were pictures.
     */
    cover: z.string().startsWith("/media/").optional(),
    /** Order in the index. Lower = earlier. */
    order: z.number().default(99),
    /** Drafts are not published in production. */
    draft: z.boolean().default(false),
    repo: z.url().optional(),
    demo: z.url().optional(),
  }),
});

/* There was a `blog` collection here and it was deleted with its section
   (owner's decision, 2026-08-21). Nothing else referred to it, so the schema
   went with the entries rather than sitting here describing a folder that no
   longer exists. */
export const collections = { projects };
