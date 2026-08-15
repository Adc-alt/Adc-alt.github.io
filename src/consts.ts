/** Site metadata. One place to change the name and the URL. */

export const SITE = {
  name: 'Antonio Delgado',
  handle: 'Adc-alt',
  role: 'Software engineer',
  /** Used in <title> and in the preview cards when the site gets shared. */
  tagline: 'I build software that gets used, not software that demos well.',
  url: 'https://adc-alt.github.io',
  locale: 'en',
} as const;

/**
 * There is no nav list here: since phase 2 the site is a single page and the
 * links are anchors to each window's `id`. The only navigation is assembled by
 * `Welcome.astro`, which is the one that knows what caption each shortcut gets.
 */

export const SOCIAL = [
  { href: 'https://github.com/Adc-alt', label: 'GitHub' },
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email' },
] as const;
