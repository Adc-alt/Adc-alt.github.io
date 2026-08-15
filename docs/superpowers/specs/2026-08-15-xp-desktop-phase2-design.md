# XP desktop — phase 2: the desktop is the site

Date: 2026-08-15
Status: approved in conversation.
Continues: `2026-08-15-xp-desktop-phase1-design.md` (§13, "out of scope").

## 1. What gets built

The desktop goes from a mock-up at `/xp/` to **being the site**. The whole
portfolio lives inside XP windows and the arcade look disappears from the
repository.

The owner's decisions, taken in conversation, and in three of the four cases
against the default recommendation:

| Question | Answer |
|---|---|
| Does the root become the desktop? | Yes |
| Do the flat pages survive? | **No.** Everything lives in windows |
| Does the pac-man survive? | **No.** It goes with the arcade |
| How do windows open? | From inside the welcome window, not from icons |

## 2. Routes

| Route | Before | After |
|---|---|---|
| `/` | arcade front page | **the desktop**, indexable |
| `/xp/` | desktop under construction | redirect to `/` |
| `/work/` | front page with no boot screen | redirect to `/` |
| `/proyectos/` | index | redirect to `/` |
| `/perfil/` | page | redirect to `/` |
| `/proyectos/<id>/` | one page per project | **goes away** |
| `/404` | arcade | XP error window |

The redirects are not a courtesy: `/work/` is the URL printed on the owner's CV
and `/proyectos/` has been in the sitemap for months. A 404 there is a lost
application. They are done with Astro's `redirects`, which on a static build
generates a `meta refresh` page.

`/proyectos/<id>/` does die without a net: today there is a single project and it
is this very site.

The `noindex` in `XP.astro` **is removed**. It was there because the desktop was
work-in-progress content that should not compete with the front page; now it is
the front page.

## 3. The windows

Five kinds, all rendered at build time (phase 1 §13: if JavaScript generated the
content, a search engine would see an empty desktop).

| Window | Opens on start-up | Content |
|---|---|---|
| Welcome | **yes** | who he is, contact, and the shortcuts to the rest |
| Projects | no | the list; each one opens its own window |
| About | no | bio and *loadout*, what is at `/perfil/` today |
| Blog | no | the entries one after another, no per-entry URL |
| Project (one per `.md`) | no | the whole project |

The welcome window is the centre and not an ornament: the owner ruled out desktop
icons and the Start menu, so **it is the only door**. If it runs out of links,
the site runs out of navigation.

### 3.1 The shortcuts are real anchors

Each shortcut is an `<a href="#window-about">` pointing at the window's `id`, not
a `<button>`. With JavaScript the manager intercepts the click and opens the
window; without it, the anchor does what an anchor does. That is what makes §4
possible without writing a second navigation.

## 4. Phone and no JavaScript: the same rule

With the flat pages gone, anyone opening the site from a phone **has only this**.
A desktop is not driven with a finger, so below **720px** it stops being a
desktop:

- The windows stop being absolute and stack in a column, all open.
- Each window body stops having its own scroll; the page scrolls.
- The three title bar buttons are hidden: in a column they mean nothing, and a
  button that does nothing is worse than no button.
- There is no dragging, and `touch-action: none` is **not** applied — if it were,
  dragging the title bar would block page scrolling.

**Stacked is the base and desktop is the enhancement**, not the other way round.
The desktop rules go inside `@media (min-width: 721px)` and hang off `html.js`, a
class set by an inline script in the `<head>`. Intended consequence: without
JavaScript, any screen falls back to stacked mode, which is readable. With the
order reversed it would take two copies of the same rules.

## 5. What gets deleted

`Base.astro`, `global.css`, `Nav`, `Footer`, `HomeContent`, `ProjectCard`,
`SectionTitle`, `Konami`, `Comecocos` with its maze and its test, and the four
pages. From `package.json`: **Tailwind** and the two `@fontsource` packages — the
desktop is scoped CSS and the only font served is the boot one, which declares
its own `@font-face`.

That is ~1,900 lines. The arcade look is not parked just in case: it is deleted.
Git history keeps it.

## 6. What changes in the window manager

On top of what already exists (`Window.astro` + `windows.mjs`):

- **Closing hides, it does not destroy.** Today it calls `remove()`, which with a
  single window that never reopened was correct. With five it is not: a destroyed
  window cannot be opened again.
- **Clicking a window brings it to the front**, with a `z-index` counter. The one
  in front has its title bar at full colour and the rest are dimmed, which is how
  you tell the active one in XP.
- **Cascade on open**: each new window is placed offset from the previous one.
  The arithmetic goes into `windows.mjs`, which already has tests, because it is
  exactly the kind of calculation that goes wrong silently.
- **The taskbar button appears and disappears** with the window.

## 7. Accepted risks

- **The Projects window has a single entry.** The rest of the owner's work is
  private and does not get published without his explicit permission. For a site
  whose stated purpose is finding work, that is the big hole, and nothing in this
  design covers it.
- **The deep per-project URLs are lost**, and so is the direct link to a blog
  entry. The owner's decision, taken with the cost on the table.
- **The content of closed windows is in the HTML but hidden.** A search engine
  sees it; it weights it less than visible content. That is the price of
  everything living on a single page.

## 8. Verification

| What | How |
|---|---|
| Cascade and clamp | `windows.test.mjs`, with `node --test` |
| Open, close, reopen, raise to front | In the browser, measuring `z-index` and `data-open` |
| Stacked mode | 400px-wide window: all visible, the page scrolls |
| No JavaScript | With JS disabled: no boot screen, every window readable |
| The redirects | `curl` to `/work/`, `/xp/`, `/proyectos/`, `/perfil/` |
| No arcade left | `grep` for `neon-`, `font-display`, `tailwind` in `src/` |
