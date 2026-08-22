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
 * The card that gets drawn when the address is pasted somewhere: LinkedIn, a
 * chat, an applicant tracking system.
 *
 * Without this the site is a grey line of text, which for a page whose whole
 * argument is what it looks like is the worst possible summary of it.
 *
 * The image is not a drawing of the site, it is the site: a screenshot of the
 * built desktop at 1400x735 scaled to 1200x630. Regenerating it is in the
 * README under "The preview card", and it wants doing whenever the desktop
 * changes shape, because nothing here can notice that it has.
 *
 * 1200x630 is the size every scraper crops to. `og:image` HAS to be absolute:
 * a scraper is not on this origin and will not resolve `/og.jpg` for you.
 *
 * `alt` matters more here than in most places. It is what someone using a
 * screen reader gets instead of the picture, and on a link to a portfolio that
 * is the difference between a description and the word "image".
 */
export const CARD = {
  image: '/og.jpg',
  width: 1200,
  height: 630,
  alt: 'A Windows XP desktop with the Bliss wallpaper and three open windows: a menu, a document being read, and a contact card.',
  /** Open Graph wants the underscored form, not the two-letter one. */
  locale: 'en_GB',
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

/**
 * One sentence, present tense, about what is on the bench right now. It is the
 * only thing on the page that says the work did not stop, and the index reads
 * "Archived, Archived, Finished" without it.
 *
 * It goes stale, and nothing here can tell that it has: no test, no build step
 * and no schema knows what month it is. Treat it the way you treat a status
 * light, and if there is nothing true to put in it, delete the block in
 * `Home.astro` rather than leave last spring's sentence up.
 */
export const NOW = {
  text: 'Right now I am designing power supplies for small satellites at DHV, and spending what is left of the week on a quadcopter: the control loop in simulation first, my own flight controller board at the end of it.',
} as const;
