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

### 4.1 The row, and when it is abandoned

`rowPositions(sizes, desk)` lays the three out as a row, horizontally centred,
**tops aligned**, at `y = round((deskHeight - taskbar - tallest) * 0.35)` — the
same 0.35 `initialPosition` already uses, so a docked window sits where a Windows
window would.

If the row plus a 16px margin each side does not fit the viewport, the function
returns `null` and the caller falls back to `cascadePosition`, which phase 2
already has and already tests. The threshold is therefore **1204px** of desktop
width. Below that the three windows cascade like phase 2, overlapping but each
reachable and draggable.

The alternative — shrinking the windows to fit — is rejected: a 460px-wide
reading pane is worse than a cascade, and the sizes are what make the layout
legible.

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
  :global(html:not([data-boot])) .xp-window {
    animation: xp-window-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay) both;
  }
  :global(html[data-boot]) .xp-window { opacity: 0; }
}
```

Phase 2 rejected `@keyframes` because an animation with a delay counts from page
load, so it would play behind the boot screen. `html:not([data-boot])` defeats
that: a CSS animation starts when the element **first matches** the rule. While
the boot screen is up the rule does not match, so no animation is running; when
`Boot.astro` removes the attribute the element starts matching and the clock
starts then.

Three things this buys that phase 2's transition did not:

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
- **It cannot strand the site invisible.** There is no base `opacity: 0`: the
  hiding is `animation-fill-mode: both` plus one rule that only applies while the
  boot screen is up. Under `prefers-reduced-motion: reduce` neither rule exists
  and everything is simply visible. This is the same discipline as
  `Boot.astro` — nothing is hidden by a mechanism that can fail open.

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
4. It marks the matching Menu entry with `aria-current="page"`. For a project
   section, `navFor()` maps it back to Projects.
5. On `hashchange` it repeats, and then moves focus to the section (which carries
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
- **Below 1204px wide the row becomes a cascade** (§4.1), which is a visibly
  different first impression on a 1024px laptop. Accepted: the alternative was
  windows too narrow to read.
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
| The stagger, on a **repeat** visit | CDP with `boot_seen` already set: sample opacity at 700ms and 1600ms |
| Switching | Click each Menu entry: assert the visible section, the window title, the taskbar button text and `aria-current` |
| Deep link | Load `/#section-project-this-desktop` directly; assert that section is the visible one |
| Stale hash | Load `/#section-nope`; assert Home is visible and the pane is not blank |
| Back button | Switch twice, go back, assert the previous section |
| Closing does not strand | Close the Menu window, assert its taskbar button survives and restores it |
| Stacked | 400px wide: three windows in a column, every section visible |
| No JavaScript | Scripting disabled: every section visible, Menu anchors jump |
| Reduced motion | With the preference set: no animation, everything visible from the first frame |
