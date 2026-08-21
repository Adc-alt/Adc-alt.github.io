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
 * Contact, in the order the Contact window shows it. `icon` names the mark
 * drawn beside each link; the marks themselves are in `Contact.astro`, because
 * a path is a drawing and this file is a list.
 *
 * The addresses used to be printed under the labels and are not any more
 * (owner's decision, 2026-08-21). Worth knowing what that costs: the email
 * address is now only reachable by following the `mailto:`, which is a dead
 * end for anyone whose browser has no mail client wired up.
 *
 * The phone number on the CV is deliberately NOT here. This page is indexed and
 * scraped; an address can be filtered, a number that leaks gets called.
 */
export const SOCIAL = [
  { href: 'mailto:adelgadocriado@gmail.com', label: 'Email', icon: 'mail' },
  { href: 'https://github.com/Adc-alt', label: 'GitHub', icon: 'github' },
  { href: 'https://www.linkedin.com/in/antonio-delgado--/', label: 'LinkedIn', icon: 'linkedin' },
] as const;
