# XP desktop — phase 3: three windows and a content pane

Date: 2026-08-16
Status: approved in conversation.
Continues: `2026-08-15-xp-desktop-phase2-design.md`.

## 1. What gets built

After the boot screen the visitor sees the bare desktop for a beat, and then
**three windows arrive one after another**, left to right:

```
┌──────────┐   ┌───────────────────────────┐   ┌────────────┐
│ Menu     │   │ Home                      │   │ Contact    │
│          │   │                           │   │            │
│ Home     │   │  (the content of whatever │   │ Email      │
│ Projects │   │   the Menu has selected)  │   │ GitHub     │
│ About me │   │                           │   │ LinkedIn   │
│ Blog     │   │                           │   │ ─────────  │
│          │   │                           │   │ colophon   │
└──────────┘   └───────────────────────────┘   └────────────┘
```

Clicking an entry in **Menu** swaps what the middle window shows and retitles
it. **Contact** never changes.

The owner's decisions, taken in conversation:

| Question | Answer |
|---|---|
| LinkedIn URL | Not yet. Contact ships with Email and GitHub; §9 has the one-line task for later |
| The blog, which was not in the requested three | **Fourth Menu entry.** The nav is a list; it grows without redesigning anything |
| Clicking a project | **Drills into the middle window**, with a `← Projects` link back |

## 2. Why this replaces phase 2's model

Phase 2 had five windows and the welcome window was the only navigation: every
link opened another window on top. That works with one project. It does not
work as a portfolio, because reading two things means arranging two windows.

Phase 3 is master-detail — the shape Windows Explorer has and the shape a
recruiter already knows. One pane to choose, one pane to read, one pane with the
address. Nothing overlaps by default, so nothing has to be moved before it can be
read.

## 3. Routes and URLs

The site stays a single page. `/`, the four redirects and `/404` are unchanged.

**Sections get a hash and it is real.** Each section lives at `#section-<name>`:

| Section | Hash |
|---|---|
| Home | `#section-home` |
| Projects | `#section-projects` |
| About me | `#section-about` |
| Blog | `#section-blog` |
| a project | `#section-project-<filename>` |

Phase 2 §7 accepted losing deep links as a cost. This recovers them for free, and
it is the mechanism rather than a feature bolted on top: the Menu entries are
plain `<a href="#section-projects">`, the click is **not** intercepted, the
browser sets the hash, and the switcher runs off `hashchange`. Consequences, all
of them wanted:

- Back and forward work, with no `history` code of our own.
- `https://adc-alt.github.io/#section-project-this-desktop` can be pasted into an
  application email and lands on that project.
- Without JavaScript the anchor does what an anchor does (§6).

The canonical URL stays `/` and the sitemap does not grow: a hash is not a URL as
far as a crawler is concerned.

## 4. The three windows

| Window | id | Size | Order | Title |
|---|---|---|---|---|
| Menu | `window-nav` | 200x260 | 0 | `Menu` |
| Main | `window-main` | 700x600 | 1 | the active section's name |
| Contact | `window-contact` | 240x300 | 2 | `Contact` |

Row width: `200 + 700 + 240 + 2 gaps of 16 = 1172`.

### 4.1 The row, and the breakpoint it defines

`rowPositions(sizes, desk)` lays the three out as a row, horizontally centred,
**tops aligned**, at `y = round((deskHeight - taskbar - tallest) * ABOVE_CENTRE)`,
using the shared `ABOVE_CENTRE` constant (0.4), so a docked window sits where a
Windows window would. The constant is shared with `initialPosition` precisely to
prevent drift — a window that opened on its own must land at the same height as
the row.

If the row plus a 16px margin each side does not fit the viewport, the function
returns `null`. The alternative — shrinking the windows to fit — is rejected: a
460px-wide reading pane is worse than no desktop at all, and the sizes are what
make the layout legible.

**Desktop mode therefore means "the row fits", and the breakpoint is that same
arithmetic:**

```
DESKTOP_MIN_WIDTH = 200 + 700 + 240 + 2×ROW_GAP + 2×ROW_MARGIN = 1204
```

It is exported from `windows.mjs`, computed from `ROW_SIZES` — which live there,
not in `index.astro`, so a window cannot change size without the breakpoint
moving with it — and it is what the script gives `matchMedia`. CSS cannot read a
JS constant, so 1204 is written out in the two media queries (`Window.astro` and
`XP.astro`), each with the arithmetic named in a comment. A unit test pins the
invariant rather than the number: `rowPositions(ROW_SIZES, …)` is non-null at
`DESKTOP_MIN_WIDTH` and `null` one pixel below.

**Why not cascade below it, as this spec first said.** `cascadePosition` centres
each window *for its own width* and steps it by 28px, so with 200 / 700 / 240 the
two small windows land geometrically inside the 700-wide pane's box — every time,
structurally, not by coincidence of one viewport. And the pane is in front, since
the switcher's first `xp:show` raises it. From 722 to 1203px the site loaded with
its only navigation invisible and unclickable, and the CC BY-SA colophon of §8
with it. That band contains a 1024x768 screen, a browser at half-width on a 1920
monitor and a 1366x768 laptop at Windows' default scaling. Below 1204 the visitor
now gets the stacked document, which is a different first impression but a
working one.

`cascadePosition` stays: `/404` mounts a single window with no `row` prop, and one
window cascading alone cannot occlude anything.

### 4.2 The entrance: the same stagger every visit

Three delays from `enterDelay(order)`, `900 + 260 * order`:

| | delay | why |
|---|---|---|
| taskbar finishes rising | 800ms | 400 waiting + 400 rising, from phase 1 §8 |
| Menu | 900ms | 100ms after the bar settles — the beat where you see only the desktop |
| Main | 1160ms | |
| Contact | 1420ms | |

**The mechanism changes from a transition to an animation, and the selector is
the whole trick:**

```css
@media (prefers-reduced-motion: no-preference) {
  :global(html[data-boot]) .xp-window { opacity: 0; }
  :global(html.js:not([data-boot]):not(.xp-arrived)) .xp-window {
    animation: xp-window-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay) both;
  }
}
```

Phase 2 rejected `@keyframes` because an animation with a delay counts from page
load, so it would play behind the boot screen. `html:not([data-boot])` defeats
that: a CSS animation starts when the element **first matches** the rule. While
the boot screen is up the rule does not match, so no animation is running; when
`Boot.astro` removes the attribute the element starts matching and the clock
starts then.

Four things this buys that phase 2's transition did not:

- **The sequence plays on a repeat visit too.** A returning visitor gets no boot
  screen — `data-boot` is never set, the rule matches from the first paint, and
  the windows arrive on the same schedule. Under phase 2's transition they simply
  appeared, so the thing the owner asked for would have been seen once per
  browser.
- **It hides the repositioning.** The server renders positions for a 1440x900
  reference desktop; the script re-lays them against the real viewport. With
  `both` fill the window holds opacity 0 through the delay, so the correction
  happens while it is invisible. Phase 2 had a visible jump here on repeat
  visits.
- **It fails open in every direction under its own control.** There is no base
  `opacity: 0`: the hiding is `animation-fill-mode: both` plus one rule that only
  applies while the boot screen is up. Under `prefers-reduced-motion: reduce`
  neither rule exists and everything is simply visible, and `html.js` is what
  keeps a no-JS visitor from waiting out a delay they cannot benefit from either:
  without JavaScript the class is never set, so the animation rule never matches
  and the windows that are open are visible immediately. The one thing this
  depends on outside itself is `Boot.astro` removing `data-boot` — phase 1 and 2
  had the same dependency, and `Boot.astro` installs its exit listeners before
  anything that can throw, precisely so that removal is guaranteed.
- **It does not replay on every open.** Taking an element out of `display: none`
  restarts every animation named on it, so a naive version of this rule would
  make closing and reopening — or minimising and restoring — a window replay the
  whole entrance, holding it at opacity 0 for the delay again. `:not(.xp-arrived)`
  closes that door, but the marker cannot be a timer: the animation's own clock
  starts when `Boot.astro` removes `data-boot`, which on a first visit is
  whenever the visitor presses a key (`AUTO_MS` is 0, so the boot screen waits
  as long as it takes), and a timer anchored to page load would fire long before
  that. Instead the script counts the windows that are open at start-up and
  listens for `animationend` on each; once every one of them has fired for
  `xp-window-enter`, `.xp-arrived` goes on `<html>` and the rule stops matching.
  There is deliberately no fallback timer: if `animationend` never arrives the
  marker just stays off, which only brings back the replay-on-reopen behaviour —
  never an invisible window. Nothing moves when the rule stops matching: the
  animation's `to` state is the window's ordinary, un-animated one.

`Taskbar.astro` converts to the same mechanism for the same reason: otherwise the
bar is already in place on a repeat visit and the "desktop, then the bar, then
the windows" beat only exists the first time.

### 4.3 Closing keeps the taskbar button

**Deliberate deviation from Windows.** In XP, closing a window removes its
taskbar button; here it stays, marked inactive, and clicking it brings the window
back.

The reason is that phase 3 removes every other way in. Phase 2 had a welcome
window full of links that reopened things; phase 3's navigation lives *inside* a
window, so closing the Menu window under XP's rule would leave a visitor with a
site and no way to navigate it, permanently, until they reloaded. There are no
desktop icons and no Start menu to recover from (owner's decision, phase 2 §3).

The consequence is that close and minimise end up looking alike. That is
accepted: a dead end is worse than a redundant button. A Start menu that lists
the windows is the honest fix and is out of scope (§10).

## 5. The middle window

`Sections.astro` renders **every section into the build**, one `<section
id="section-…" data-title="…">` each, in this order: Home, Projects, About me,
Blog, then one per project. Phase 1 §13 still governs: if JavaScript generated
this, a crawler would see an empty pane.

The switcher script:

1. On load, `resolveSection(ids, location.hash)` picks the section. An unknown,
   stale or foreign hash (`#window-main`, a leftover `#ventana-perfil`) falls
   back to the first section rather than leaving the pane blank. That fallback is
   the whole reason the function is pure and tested.
2. It hides the others with the `hidden` attribute, which removes them from the
   tab order and the accessibility tree — no `inert` needed, same reasoning as
   phase 2's `display: none`.
3. It sets the window title from the section's `data-title` by dispatching
   `xp:title` on the window element. `Window.astro` owns the listener and updates
   **both** the title bar and the taskbar button, because the taskbar button text
   is copied once at start-up and would otherwise go stale.
4. It also dispatches `xp:show` on the window element, right after `xp:title`.
   `Window.astro`'s listener reopens the pane if it was closed: closing it is
   allowed (§4.3), and phase 3 does not intercept Menu clicks, so nothing else
   would bring it back — neither the first click on an entry (which changes the
   hash and fires `hashchange`) nor a click on the entry that is *already*
   current (which sets an identical hash, fires no `hashchange`, and is handled
   by a second, dedicated click listener that re-runs the switcher by hand,
   without `preventDefault`).

   A consequence worth naming: `xp:show` also brings the pane to the front, and
   it fires once more on load (the switcher's first call, deferred to
   `DOMContentLoaded`). Without it, whichever window is last in DOM order —
   Contact — would be the one left in front once every window's own start-up
   `toFront()` has run. With it, the reading pane ends up in front at load
   instead, which is the more useful default: a visitor who has not touched
   anything yet is almost certainly about to read.
5. It marks the matching Menu entry with `aria-current="page"`. For a project
   section, `navFor()` maps it back to Projects.
6. On `hashchange` it repeats, and then moves focus to the section (which carries
   `tabindex="-1"`). **Not on the initial load** — focusing on load scrolls the
   page for someone who has not asked for it.

The switcher runs in **both** modes, not just desktop. On a phone with JavaScript,
one section at a time beats a single column containing the whole site.

## 6. Without JavaScript

Unchanged rule from phase 2 §4: no JavaScript means stacked mode, because
`html.js` is what unlocks desktop mode.

- The three windows stack in a column: Menu, Main, Contact.
- **Every section inside Main is visible**, one after another. Nothing is hidden,
  because hiding is the switcher's job and the switcher is not running.
- The Menu entries are anchors to ids that exist on the page, so they jump.
  `scroll-behavior: smooth` already makes the jump visible.

So the no-JavaScript site is a long, ordered, readable document with a table of
contents at the top. That is the correct fallback and it costs nothing extra.

## 7. What moves and what goes

| Was | Becomes |
|---|---|
| `Welcome.astro` (window) | `Home.astro` (section) — same intro, minus the shortcut grid, which the Menu window now is |
| `Projects.astro`, `About.astro`, `Blog.astro` (window bodies) | sections, unchanged content |
| `Project.astro` (one window each) | a section each, plus a `← Projects` link back |
| the welcome window's colophon | the Contact window (§8) |

Deleted: nothing. Every component survives as a section; only `index.astro`'s
window list is rewritten.

## 8. The colophon is a licence obligation, again

The CC BY-SA 4.0 credit for the boot font lived in the welcome window because
that window was always open. Phase 3 has no welcome window, and Home is not
always on screen — you can switch to Projects and it is gone.

It moves to the **Contact window**, which is the only pane in phase 3 whose
content never changes. That is the third home this credit has had (footer →
welcome → contact) and the third time it was nearly dropped in a refactor, so:
`Contact.astro` carries a comment saying it is a licence obligation and not
decoration.

## 9. Accepted risks and known gaps

- **LinkedIn is missing.** Contact ships with Email and GitHub. Adding it is one
  entry in `SOCIAL` in `src/consts.ts`; the window renders whatever is in that
  array, so no other file changes.
- **The Projects section still has one entry, and it is this site.** Unchanged
  from phase 2 §7 and still the largest gap in a portfolio whose purpose is
  finding work. No layout fixes it.
- **Below 1204px wide there is no desktop at all** (§4.1): the site is the
  stacked column of windows, which is a visibly different first impression on a
  1024px laptop or a half-width browser window. Accepted: the alternatives were
  windows too narrow to read, or a cascade that buries the navigation. A layout
  that flexes the reading pane between, say, 900 and 1204, would recover the
  desktop there and can be added later without undoing any of this.
- **Section content that is hidden is still in the HTML.** Same trade as phase 2
  §7: a crawler sees it and weights it below visible text.

## 10. Out of scope

- A Start menu listing the open windows (the honest fix for §4.3).
- Desktop icons.
- Per-section `<title>` or meta description — they would need real URLs, not
  hashes.
- Remembering the last section between visits.

## 11. Verification

| What | How |
|---|---|
| `resolveSection`, `navFor` | `sections.test.mjs`, `node --test` |
| `enterDelay`, `rowPositions` | `windows.test.mjs`, `node --test` |
| The row lands where §4.1 says | CDP at 1440x900: read the three `getBoundingClientRect`, assert gaps of 16 and equal tops |
| **The breakpoint, from both sides** | CDP at 1204x900 and 1203x900: at 1204 three windows in the row and `elementFromPoint` at the centre of a Menu link resolves inside `#window-nav`; at 1203 no desktop |
| **One viewport between the two ends** | CDP at 1000x800: stacked, `.xp-window` is `position: relative` and the document reads |
| **A section that is not the first** | Switch to About, Blog and a project: the visible section's computed `border-top-width` is `0px` |
| The stagger, on a **repeat** visit | CDP with `boot_seen` already set: sample opacity at 700ms and 1600ms |
| Switching | Click each Menu entry: assert the visible section, the window title, the taskbar button text and `aria-current` |
| Deep link | Load `/#section-project-this-desktop` directly; assert that section is the visible one |
| Stale hash | Load `/#section-nope`; assert Home is visible and the pane is not blank |
| Back button | Switch twice, go back, assert the previous section |
| Closing does not strand | Close the Menu window, assert its taskbar button survives and restores it |
| Stacked | 400px wide: three windows in a column, every section visible |
| No JavaScript | Scripting disabled: every section visible, Menu anchors jump |
| Reduced motion | With the preference set: no animation, everything visible from the first frame |
