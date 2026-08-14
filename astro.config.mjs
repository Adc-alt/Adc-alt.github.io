// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Sitio de usuario (Adc-alt.github.io) → se sirve en la raíz, sin `base`.
// Si algún día se mueve a un repo de proyecto, hay que añadir base: '/<repo>'.
export default defineConfig({
  site: 'https://adc-alt.github.io',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
