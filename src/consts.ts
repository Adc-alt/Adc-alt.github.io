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
 * Contact, in the order the Contact window shows it. `value` is what is printed
 * under the label — a label alone makes someone click to find out the address.
 *
 * LinkedIn is missing on purpose: the owner has not handed over the URL. Adding
 * it is one entry here and nothing else, because the window renders this array.
 */
export const SOCIAL = [
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email', value: 'adelgadocriado@gmail.com' },
  { href: 'https://github.com/Adc-alt', label: 'GitHub', value: 'Adc-alt' },
] as const;
