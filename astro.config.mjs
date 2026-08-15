// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Sitio de usuario (Adc-alt.github.io) → se sirve en la raíz, sin `base`.
// Si algún día se mueve a un repo de proyecto, hay que añadir base: '/<repo>'.
export default defineConfig({
  site: 'https://adc-alt.github.io',

  // Las rutas de antes de la fase 2. No son cortesía: `/work/` es la URL que
  // está en el currículum y `/proyectos/` lleva meses en el sitemap; un 404
  // ahí es una candidatura perdida. En salida estática Astro genera para cada
  // una una página con `meta refresh`, no una redirección HTTP: GitHub Pages
  // no sabe hacer 301.
  redirects: {
    '/work/': '/',
    '/xp/': '/',
    '/proyectos/': '/',
    '/perfil/': '/',
  },

  integrations: [
    // El sitio entero es una sola página. Todo lo demás son redirecciones y el
    // 404, y ninguna de las dos cosas pinta nada en un sitemap.
    sitemap({ filter: (page) => page === 'https://adc-alt.github.io/' }),
  ],
});
