import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Cada proyecto es un .md en src/content/proyectos/.
 * El nombre del fichero es la URL: `hito.md` → /proyectos/hito/
 *
 * El schema no es decoración: si a un proyecto le falta un campo o pones
 * un `status` que no existe, `pnpm build` FALLA. Es imposible desplegar
 * una tarjeta a medias.
 */
const proyectos = defineCollection({
  loader: glob({ base: "./src/content/proyectos", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Una frase. Es lo que se lee en la tarjeta; que quepa. */
    summary: z.string().max(180),
    year: z.number().int().min(2000).max(2100),
    stack: z.array(z.string()).min(1),
    status: z.enum(["live", "wip", "archived"]),
    accent: z.enum(["cyan", "magenta", "amber", "lime"]).default("cyan"),
    /** Orden en la rejilla. Menor = antes. */
    order: z.number().default(99),
    featured: z.boolean().default(false),
    /** Los borradores no se publican en producción. */
    draft: z.boolean().default(false),
    repo: z.url().optional(),
    demo: z.url().optional(),
  }),
});

/**
 * Cada entrada del blog es un .md en src/content/blog/.
 *
 * De momento no hay URL por entrada: se pintan todas seguidas dentro de la
 * ventana del escritorio, que es un feed. El día que haya suficientes, el
 * `id` del fichero ya sirve de slug sin tocar nada de aquí.
 */
const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Fecha de publicación. Ordena el feed: la más reciente arriba. */
    date: z.date(),
    /** Una frase de entradilla. Que quepa en la ventana sin scroll. */
    summary: z.string().max(200),
    draft: z.boolean().default(false),
  }),
});

export const collections = { proyectos, blog };
