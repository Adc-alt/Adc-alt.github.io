# Adc-alt.github.io

Personal portfolio. It is a Windows XP desktop: the content lives inside windows
that drag, minimise and close.
Live at: **https://adc-alt.github.io/**

A static site generated with Astro. **All the HTML comes out of the build**,
windows and sections included: the JavaScript only opens, moves and closes
windows, and swaps which section the reading pane shows. If it does not run,
the site reads the same (see *Two modes*). The only three scripts are the boot
screen (inline), the window manager with the tray clock, and the section
switcher.

## Routes

The site is **a single page**.

| Route | What it is |
|---|---|
| `/` | The desktop, with every window inside it. **With the boot screen** on a first visit |
| `/404` | XP error window |
| `/work/`, `/xp/`, `/proyectos/`, `/perfil/` | Redirects to `/` |
| `/#section-<name>` | A section of the reading pane. `home`, `projects`, `about`, `blog`, or `project-<filename>`. Shareable and back-button friendly; not a separate URL, so not in the sitemap |

The redirects are the previous version's routes. They are not a courtesy:
`/work/` is the URL printed on the CV. On a static build Astro generates a `meta
refresh` page for each one — GitHub Pages cannot do a 301.

## Getting started

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with hot reload |
| `pnpm build` | tests + `astro check` (types) + build to `dist/` |
| `pnpm preview` | Serves `dist/` the way production will |
| `pnpm test` | Just the tests (`node --test`) |

## Structure

```
src/
├── consts.ts                 name, URL and social links
├── content.config.ts         Zod schemas for projects and blog
├── content/projects/*.md     one file = one project = one section
├── content/blog/*.md         one file = one entry
├── styles/xp-doc.css         the document inside a window
├── layouts/XP.astro          <head>, wallpaper and taskbar
├── components/
│   ├── Boot.astro            the boot screen
│   └── xp/
│       ├── Window.astro      the frame and the window manager
│       ├── windows.mjs       position, row and entrance arithmetic (with tests)
│       ├── Taskbar.astro     taskbar + clock
│       ├── taskbar-colors.mjs  measured colours (with tests)
│       ├── sections.mjs      the Menu and the section registry (with tests)
│       ├── Nav.astro         the Menu window
│       ├── Sections.astro    the reading pane and its switcher
│       ├── Contact.astro     the Contact window
│       ├── MediaPlayer.astro the song behind the Music shortcut
│       └── Home | Projects | Project | About | Blog
└── pages/
    ├── index.astro           mounts the desktop and every window
    └── 404.astro
```

## Adding content

**A project:** copy `src/content/projects/_template.md`, rename it and set
`draft: false`. Its section and its entry in the Projects list appear on their
own; the filename becomes its section id (`my-project.md` →
`#section-project-my-project`).

**A blog entry:** a `.md` in `src/content/blog/`. They are ordered by date,
newest at the top.

**A video:** shrink it first. `ffmpeg -i in.mp4 -vf scale=-2:960 -crf 28 -preset
slow -c:a aac -b:a 96k -movflags +faststart out.mp4` took the smart car's phone
recording from 194 MB to 7.8 MB, which is the difference between a file that can
live in a git repository and one that cannot. Put it in `public/media/` with a
poster frame beside it (`ffmpeg -ss 0.5 -i out.mp4 -frames:v 1 -q:v 4
poster.jpg`) and write it as a `<figure class="clip">` with **`preload="none"`**:
the poster is then the only thing a visitor who came to read pays for, and the
video is fetched on the first press. `src/content/media.test.mjs` fails the build
if a `src` or a `poster` points at a file that is not in `public/`.

Watch what is on screen in the footage. Seven seconds are cut out of the middle
of the smart car clip because the phone's network settings were open, and a list
of the SSIDs around a flat is an address in a wardriving database.

Both frontmatters are validated with Zod in `src/content.config.ts`: if a field
is missing or the `status` is not one of the three valid ones, **the build
fails**.

Files with `draft: true` show up in `pnpm dev` but are **not published**.

## Two modes, and the order matters

**Desktop mode means "the three-window row fits".** Below **1270px** the windows
stop being absolute, stack in a column with all of them open and the page
scrolls; the three title bar buttons are hidden, and dragging is switched off.

1270 is derived, not chosen: `200 + 750 + 240` for the windows, `2 × 24` for the
gaps between them and `2 × 16` for the margins at the ends — `DESKTOP_MIN_WIDTH`
in `src/components/xp/windows.mjs`, pinned by a test that asserts the row fits at
that width and does not one pixel below. A narrower desktop would have to cascade
the three, and a cascade centres each window for its own width, which parks the
200-wide Menu and the 240-wide Contact entirely inside the 750-wide reading pane
— the site would load with its only navigation invisible. CSS cannot read a JS
constant, so the number is written out in three media queries, each with the
arithmetic in a comment beside it.

⚠️ **That number has a ceiling of 1280.** It is what a very common laptop screen
is, and one pixel over it every one of them loses the desktop and gets the
stacked document instead. The reading pane is 750 wide today and the row spends
1270 of the 1280: there are ten pixels left. Growing the pane again means taking
them off the gaps or off the two small windows, not off that margin.

**Stacked is the base and the desktop is the enhancement.** The desktop rules
live inside `@media (min-width: 1270px)` and hang off `html.js`, a class set by
an inline script in the `<head>`. Intended consequence: **without JavaScript the
whole site falls back to stacked mode**, on any screen, and it reads. Written the
other way round it would take two copies of the same rules and a JS failure would
leave the site blank.

If you touch window CSS, check which block you are in. `touch-action: none` on
the title bar belongs to desktop mode and **cannot leave it**: when stacked it
would block page scrolling as you drag the title.

## The windows

Three of them: `Menu` on the left, the reading pane in the middle, `Contact` on
the right. They arrive in that order after the boot screen. `Contact` never
changes; the Menu swaps what the middle one shows.

Four things that break by themselves if left unattended:

- **Position always goes through `clampPosition`** (`windows.mjs`, with tests).
  The classic failure of a homemade manager is letting you drag until the title
  bar is off the screen. `KEEP_VISIBLE` is 110px and not 60 because the three
  buttons take ~70 at the right end of the bar.
- **The row is `y = round((height − taskbar − tallest) × ABOVE_CENTRE)`**, with
  `ABOVE_CENTRE` (0.4) shared with `initialPosition` so the two cannot drift. At
  1440x900 that is `x = 134 / 350 / 1066` with 16px gaps, `y = 104` for all
  three. The row's sizes live in `windows.mjs` and not in `index.astro` because
  the desktop breakpoint is derived from them; `rowPositions` returns `null`
  rather than squeezing the windows, which below `DESKTOP_MIN_WIDTH` is
  unreachable — the media query has already sent the page to stacked mode.
- **Closing keeps the taskbar button**, deliberately unlike XP. XP can afford to
  drop it because it has desktop icons and a Start menu; here the taskbar is the
  only way back, and the navigation lives inside a window.
- **The arrival is a CSS animation, not a transition**, gated on
  `html.js:not([data-boot]):not(.xp-arrived)`. An animation starts the moment
  its element first matches the rule, so it fires when `Boot.astro` removes
  `data-boot` on a first visit, and at first paint on a repeat one — the
  sequence plays every visit, not only the first. Taking an element out of
  `display: none` restarts its animations, so a script adds `.xp-arrived` once
  every arriving window's `animationend` has fired; without that marker every
  later reopen would replay the delay. `html.js` in the selector is what stops a
  no-JS visitor waiting out a delay they have no script to benefit from.

⚠️ **The window colours are NOT measured**, unlike the taskbar's. They are the
public Luna approximation that circulates around, eyeballed against memory. The
component header says so.

Two custom events drive a window from outside: **`xp:title`** (detail: a
string) retitles the title bar and the taskbar button together, and
**`xp:show`** reopens, restores and fronts a window without taking focus.

Sections are `#hash` links and clicks are **not** intercepted: the browser sets
the hash and the switcher runs off `hashchange`, which is where the back button
and shareable section links come from. `resolveSection` falls back to Home for a
hash nobody recognises, so a stale link never leaves the pane blank.

The blog has no per-entry URL: they all render one after another inside their
section. With two entries that would be two pages of one paragraph; the
filename already works as a slug the day it is needed.

## Deploy

Push to `main` → GitHub Actions (`.github/workflows/deploy.yml`) builds and
publishes. About 40-60 seconds. Nothing needs doing by hand.

The Pages source is **GitHub Actions**, not "deploy from a branch". `dist/` is
not committed.

## Accessibility

- Every animation is behind `prefers-reduced-motion`.
- Focus is always visible; never `outline: none` without a replacement.
- The three buttons on each window are `<button>` with an `aria-label`, and
  minimise/maximise carry `aria-pressed`.
- Reopening a window from the taskbar moves focus into it; closing it returns
  focus to the taskbar button. Switching sections moves focus to the new one,
  except on the page's first load, which does not scroll a visitor who has not
  asked for it.
- The wallpaper and the bar's ornaments carry `aria-hidden`.

The XP colours **do not reach AA for body text**: white on the Start button green
gives 3.50:1 and on the tray blue 3.39:1, against the 4.5:1 the standard asks
for. Both pairs do clear the 3:1 of AA for large text, and that threshold also
requires the text to be genuinely large (≥24px, or ≥18.66px bold):

- **"start" does meet AA for large text.** It is 19px bold, with its 3.50:1.
- **The clock does not.** 14px non-bold is body text, and 3.39:1 is a long way
  from 4.5:1.

It is a decision taken knowingly — dragging the colours down until they comply
stops it looking like XP — and for the clock the mitigation is different: the
time reaches a screen reader intact through the `<time datetime>` whatever
happens to the contrast. The test pins the 3:1 floor so it cannot get worse
without anyone noticing.

## Boot screen

`src/components/Boot.astro` + `src/components/boot-data.mjs`. A fake BIOS POST
that covers the desktop the first time. Skipped with any key, click or tap.

**It is a homage traced from the boot screen of
[senna.social](https://senna.social/).** The layout, the colours, the timings and
the text are theirs; what changes here is the identity (the name, ADCSOFT, and a
seal and a signature doodle drawn here in place of their two images). Not one of
their files is copied: the drawings are our own SVG.

The measurements, with captures and the reason behind every number, are in
`docs/superpowers/specs/2026-08-14-boot-screen-senna-parity.md`.

To change the text or the timings, `boot-data.mjs` — but
**`boot-data.test.mjs` will stop you**, because it checks the values against the
reference's table. That is on purpose: if you change a number, change it knowing
you have stopped copying it.

Four things that look like details and hold up everything else:

- **The typeface has to be the `AcPlus` variant** (aspect-corrected), not
  `Web437` or `WebPlus`. IBM VGA 8x16 was seen on a 720x400 VGA stretched onto a
  4:3 screen, that is, with pixels taller than they are wide; `AcPlus` bakes that
  stretch in (advance 0.4167em instead of 0.5em). With `WebPlus` the letters come
  out square and wide and the resemblance breaks however well everything else
  lines up.
- **There is no fade.** The `transition: visibility 0s .5s` keeps each line
  hidden while its opacity rises, so it appears all at once and 500ms later than
  the table says. It is a bug in the reference, but you can see it, so it gets
  copied. Do not "fix" it.
- **The 1.1s pause before the checks is not an oversight.** It is what makes it
  look like a machine testing itself instead of text appearing. The last check
  also takes 450ms longer than the others.
- **The columns are in `ch`, not pixels.** At 24px a `ch` of this font is 9.99px,
  so `20ch` is exactly the reference's 200px, and it also shrinks by itself when
  a phone drops the font to 16px.

It goes in the layout's `overlay` slot, outside `<main>`. The whole site is in
the HTML behind it, so search engines and preview cards see the desktop and not
the boot screen.

All its JS is `is:inline` and **the script shows the screen**, it does not hide
it: if the JS fails, the visitor sees the site; the other way round they would
see a black screen with no way out.

To see it again: delete `boot_seen` from `localStorage`.

The **AcPlus IBM VGA 8x16** typeface is by
[VileR](https://int10h.org/oldschool-pc-fonts/), CC BY-SA 4.0, in `public/fonts/`
with its licence next to it. **The credit the licence requires is in the Contact
window**, the one pane whose content never changes — it lived in the site
footer before the arcade look went away, then in the welcome window before
phase 3 removed it. The `.woff2` was taken from the
`_win` pack (the `Ac` ones are not in the web pack) by converting the TTF with
`fonttools`.

## The taskbar

Its colours **are measured** off XP screenshots, pixel by pixel, and the whole
derivation lives in `taskbar-colors.mjs` with tests. The measurements, with
captures and the reason behind every number, are in
`docs/superpowers/specs/2026-08-15-xp-desktop-phase1-design.md`.

Three things that look like details and hold up the rest:

- **The bar is not a gradient.** It is a light edge, an almost flat body over two
  thirds of the height, and three pixels that darken abruptly at the end. A
  two-colour `linear-gradient` looks wrong. `taskbar-colors.test.mjs` rejects the
  flat bar, the two-stop one and the smooth gradient: if you touch the colours,
  the probe tells you.
- **The clock tray is LIGHTER than the bar, not darker.** What makes it look
  sunken is the 1px dark edge on its left. Painting it darker is what instinct
  asks for and it is what breaks it.
- **The bar rises 400ms after the boot screen reveals the wallpaper**, and that
  is what makes it look like a machine starting up instead of an image. It
  carries no JavaScript: `Boot.astro` removes `html[data-boot]` when it finishes
  and the bar reacts to the attribute going away.

## Files that are not mine

**The wallpaper is Bliss, the Windows XP photograph** (Charles O'Rear, owned by
Microsoft). `public/xp/bliss.webp` comes from the `bg.jpg` of
[winbows.neocities.org](https://winbows.neocities.org/), rescaled to 2560x1440
and re-encoded to WebP: 1008 KB → 225 KB. **It is not a free image**: it is used
here as a homage, the way half the internet does, and if it ever becomes a
problem it is replaced by deleting that file — the fallback gradient in
`Wallpaper.astro` keeps the page standing without it.

**The Start button logo is Microsoft's too.** `public/xp/win-flag.png` comes from
winbows' `win-min.png`, reduced to 52x48 (painted at 26px tall, at double size so
it is not blurry on retina). Same caveat as the wallpaper: it is a registered
trademark and not a free image.

**The click and the five icons are Microsoft's as well.** `public/xp/click.wav`
is `Windows Navigation Start.wav`, downmixed to mono 22 kHz. The five PNGs in
`public/xp/icons/` are the real XP artwork at the 32x32 XP drew them at: the
Minesweeper mine, the Solitaire card box and the 3D Pinball ball come from the
extracted set at
[lelegofrog.github.io/winicogames.html](https://lelegofrog.github.io/winicogames.html),
the folder from winbows' `folder.png`, rescaled from 800x800, and `media.png` is
the Windows Media Player orb, supplied by the owner. That last one arrived as a
JPEG of a transparent PNG — the checkerboard baked into the picture — so it is
cut out rather than converted: the circle is the only saturated thing in the
frame, which is what locates it, and the 32x32 is sampled out of it behind a
circular alpha, three pixels in from the rim so none of the checkerboard the
edge is blended with survives. Two of them were drawn by hand first and replaced with the originals at
the owner's express request. Same caveat as the wallpaper, and the same escape
hatch: they are five files, and deleting them breaks nothing but the picture.

**3D Pinball is somebody else's build, running in a page of ours.**
`public/xp/pinball.html` loads the engine from
[pinball.alula.me](https://pinball.alula.me/) — k4zmu2a's decompilation of the
original, ported to WebAssembly by alula, MIT, and served with
`access-control-allow-origin: *`. It used to be framed from their page instead;
it is loaded here so the page can turn the game's music off, which cannot be
done to a frame from another origin. **The game's data is Microsoft's, is not
redistributable, and is not in this repository**: it is fetched from their
server, and only once the visitor presses Load. Nothing is requested from them
before that. The music is the two MIDI files in that package and nothing else,
so the loader hands the game an empty file where each one should be: it comes up
with no music to play and every sound effect intact.

**Solitaire is somebody else's too, and framed rather than loaded.** It used to
be a game written for this site — a pack of cards and every rule of Klondike in
`solitaire.mjs` — and the owner asked for it to come from somewhere else, so all
of that is deleted. `Solitaire.astro` frames
[Cyanoxide's react-solitaire](https://github.com/Cyanoxide/react-solitaire): XP's
Solitaire rebuilt, down to the Bliss card back and the cascade of bouncing cards
when you win. The first pick was a clean modern-looking Klondike and it was sent
back, which is the rule this desktop runs on — the point is that it is XP's, not
that it is a card game. The better-known solitaire sites lose on a different
count: they open with a consent dialog listing a couple of hundred advertising
partners, and framing one would hand every one of them a visitor who came to a
site that promises no analytics and no cookies. Nothing is fetched from their
host until you press Deal, and `Game -> Deal` is a fresh load with a counter in
the query: assigning a frame the URL it already has is not reliably a
navigation. **The cards are Microsoft's artwork**, same caveat as the wallpaper
— and, like the pinball table's data, no copy of them is in this repository.

⚠️ **That frame is cropped by 22px and the number is measured, not derived.** The
game draws a `Game | Help` menu bar of its own and this window already has one,
so the frame is pulled up by exactly the height of theirs and the stage clips it
— the same problem the pinball had with its window chrome, and the same answer.
The frame is another origin, so there is no measuring it from here: if they ever
drop that bar, the crop starts eating the top of the table instead.

**The pinball flippers answer to the arrow keys, and that is ours.** The game's
own keys are `Z` and `/` — the original's — and its keymapper is drawn inside
the canvas, in settings this page never sees. So the rebinding does not happen
there: `public/xp/pinball.html` translates `ArrowLeft` and `ArrowRight` into the
keys the game is already listening for, on the way in, `keyup` as well as
`keydown`. Miss the `keyup` half and the flipper stays up for the rest of the
game. `ArrowUp` is deliberately not in that table: it is the game's own bottom
table bump.

**The song behind the Music shortcut is not in this repository either.** It is
the official YouTube embed, and like the pinball table it loads on a use and not
before — an embed that started by itself would call Google on every visit to a
site whose whole pitch is no analytics and no cookies. There is no player and no
window: the shortcut plays the song, and plays it again to stop, because
stopping means *destroying* the frame. A cross-origin frame carries on playing
however well it is hidden, and there is no reaching in to pause it. Its host
sits off the left edge of the screen rather than under `display: none`, which
would stop the frame loading at all.

Of the bar itself, on the other hand, not one file has been copied: only
measurements and colours, which are facts and not work.

## What is still in Spanish

The four design specs under `docs/superpowers/specs/` — the boot screen and the
three desktop phases — are translated, because code comments point at them.

Two things stay in Spanish on purpose:

- `docs/01`–`docs/04`, the owner's own learning notes on static web, git and
  HTML. They are a notebook, not documentation of this site.
- `docs/superpowers/plans/`, the execution checklists for work that has already
  shipped. Nothing points at them and nothing will read them again.
