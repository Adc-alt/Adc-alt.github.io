/** Site metadata. One place to change the name and the URL. */

export const SITE = {
  name: 'Antonio Delgado',
  handle: 'Adc-alt',
  role: 'Electronics and embedded systems engineer',
  /** Used in <title> and in the preview cards when the site gets shared. */
  tagline: 'I build hardware and write the firmware that runs on it.',
  url: 'https://adc-alt.github.io',
  locale: 'en',
} as const;

/**
 * Contact, in the order the Contact window shows it. `value` is what is printed
 * under the label — a label alone makes someone click to find out the address.
 *
 * The phone number on the CV is deliberately NOT here. This page is indexed and
 * scraped; an address can be filtered, a number that leaks gets called.
 */
export const SOCIAL = [
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email', value: 'adelgadocriado@gmail.com' },
  { href: 'https://github.com/Adc-alt', label: 'GitHub', value: 'Adc-alt' },
  { href: 'https://www.linkedin.com/in/antonio-delgado--/', label: 'LinkedIn', value: 'antonio-delgado--' },
] as const;
