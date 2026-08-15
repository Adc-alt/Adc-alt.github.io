/** Metadatos del sitio. Un único sitio donde tocar el nombre y la URL. */

export const SITE = {
  name: 'Antonio Delgado',
  handle: 'Adc-alt',
  role: 'Ingeniero de software',
  /** Se usa en <title> y en las tarjetas de previsualización al compartir. */
  tagline: 'Construyo software que se usa, no que se demuestra.',
  url: 'https://adc-alt.github.io',
  locale: 'es',
} as const;

/**
 * Aquí no hay lista de navegación: desde la fase 2 el sitio es una sola página
 * y los enlaces son anclas al `id` de cada ventana. La única navegación la
 * arma `Bienvenida.astro`, que es quien sabe qué pie lleva cada acceso.
 */

export const SOCIAL = [
  { href: 'https://github.com/Adc-alt', label: 'GitHub' },
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email' },
] as const;
