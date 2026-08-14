/** Metadatos del sitio. Un único sitio donde tocar el nombre, la URL y el menú. */

export const SITE = {
  name: 'Antonio Delgado',
  handle: 'Adc-alt',
  role: 'Ingeniero de software',
  /** Se usa en <title> y en las tarjetas de previsualización al compartir. */
  tagline: 'Construyo software que se usa, no que se demuestra.',
  url: 'https://adc-alt.github.io',
  locale: 'es',
} as const;

// ⚠️ Estas etiquetas se pintan en Press Start 2P, que NO tiene acentos en
// mayúscula. Todo lo que se pinte en tipografía display debe ser ASCII:
// por eso «Perfil» y no «Sobre mí».
export const NAV = [
  { href: '/', label: 'Inicio' },
  { href: '/proyectos/', label: 'Proyectos' },
  { href: '/perfil/', label: 'Perfil' },
] as const;

export const SOCIAL = [
  { href: 'https://github.com/Adc-alt', label: 'GitHub' },
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email' },
] as const;
