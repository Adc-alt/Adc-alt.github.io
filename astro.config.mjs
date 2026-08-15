// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// User site (Adc-alt.github.io) → served from the root, no `base`.
// If it ever moves to a project repo, base: '/<repo>' has to be added.
export default defineConfig({
  site: 'https://adc-alt.github.io',

  // The routes from before phase 2. They are not a courtesy: `/work/` is the
  // URL printed on the CV and `/proyectos/` has been in the sitemap for months;
  // a 404 there is a lost application. On a static build Astro generates a
  // `meta refresh` page for each one, not an HTTP redirect: GitHub Pages cannot
  // do 301s.
  redirects: {
    '/work/': '/',
    '/xp/': '/',
    '/proyectos/': '/',
    '/perfil/': '/',
  },

  integrations: [
    // The whole site is a single page. Everything else is redirects and the
    // 404, and neither of those belongs in a sitemap.
    sitemap({ filter: (page) => page === 'https://adc-alt.github.io/' }),
  ],
});
