// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Sitio de usuario (Adc-alt.github.io) → se sirve en la raíz, sin `base`.
// Si algún día se mueve a un repo de proyecto, hay que añadir base: '/<repo>'.
export default defineConfig({
  site: 'https://adc-alt.github.io',
  // /work/ y /xp/ no deben competir en Google con la portada: /work/ es la
  // misma portada sin pantalla de arranque, y /xp/ es el escritorio en obras.
  // Los dos llevan además `noindex` y canonical a la raíz.
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith("/work/") && !page.endsWith("/xp/"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
