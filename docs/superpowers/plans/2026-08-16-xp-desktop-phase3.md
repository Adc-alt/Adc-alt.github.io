# XP Desktop Phase 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After the boot screen, three XP windows arrive left to right — a Menu, a content pane that the Menu swaps, and a Contact card — replacing phase 2's five stacked windows.

**Architecture:** The Menu entries are ordinary `#hash` anchors; the browser sets the hash, a `hashchange` listener swaps which `<section>` inside the middle window is visible, and the window retitles itself through a custom event. Every section is rendered at build time, so no JavaScript means one long readable document. Window placement and entrance timing move into `windows.mjs` as pure functions with tests.

**Tech Stack:** Astro 7, TypeScript, plain ES modules, `node:test`, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-16-xp-desktop-phase3-design.md`

## Global Constraints

- **The repo is public.** Nothing secret gets committed.
- **Commit messages are in Spanish** (repo convention). **No `Co-Authored-By` and no "Generated with" line** — verify after every commit with `git log -1 --format='%B' | grep -iE "co-authored|claude|generated with"`, which must print nothing.
- **Code, comments, content and docs are in English** (owner's decision, 2026-08-15). Only `docs/01`–`docs/04` and `docs/superpowers/plans/` predating today stay Spanish.
- **All content is rendered at build time.** JavaScript may only show, hide, move and retitle. If JS generates content, a crawler sees an empty desktop (phase 1 §13).
- **Stacked is the base, desktop is the enhancement.** Desktop rules live inside `@media (min-width: 721px)` **and** hang off `:global(html.js)`. Astro scopes every compound selector, so an ancestor naming something outside the component MUST be written `:global(html.js)` or it compiles to `html[data-astro-cid-…]` and never matches.
- **Nothing is hidden by a mechanism that can fail closed.** No base `opacity: 0` that a failed script must undo.
- **Every animation sits behind `prefers-reduced-motion`.**
- `pnpm build` runs tests + `astro check` + build and must end with **0 errors, 0 warnings, 0 hints**.
- Ports: 3000 and 4000/4001 belong to other projects. Use **4321** for `pnpm preview` and **9224** for CDP, and kill both when finished (`ss -ltn | grep -E "4321|9224"` must print nothing).

---

### Task 1: The section registry

A pure module so the middle window can never end up blank and the Menu can never point at a section that does not exist.

**Files:**
- Create: `src/components/xp/sections.mjs`
- Test: `src/components/xp/sections.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `NAV: Array<{id: string, label: string}>` — the four Menu entries, in order.
  - `sectionId(name: string) => string` — `"home"` → `"section-home"`.
  - `projectSectionId(fileId: string) => string` — `"this-desktop"` → `"section-project-this-desktop"`.
  - `resolveSection(ids: string[], hash: string) => string` — always returns a member of `ids`.
  - `navFor(sectionId: string) => string` — which Menu entry to mark current.
  - `STATUS: Record<string, string>` — moved here from `projects.mjs`, which Task 4 deletes.

- [ ] **Step 1: Write the failing test**

Create `src/components/xp/sections.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { NAV, navFor, projectSectionId, resolveSection, sectionId } from "./sections.mjs";

const IDS = [
  "section-home",
  "section-projects",
  "section-about",
  "section-blog",
  "section-project-this-desktop",
];

test("the Menu is the four entries the spec names, in order", () => {
  assert.deepEqual(
    NAV.map((n) => n.id),
    ["home", "projects", "about", "blog"],
  );
  assert.deepEqual(
    NAV.map((n) => n.label),
    ["Home", "Projects", "About me", "Blog"],
  );
});

test("every Menu entry points at a distinct section id", () => {
  const ids = NAV.map((n) => sectionId(n.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^section-[a-z-]+$/);
});

test("a project's section id is derived from its filename", () => {
  assert.equal(projectSectionId("this-desktop"), "section-project-this-desktop");
});

test("a known hash resolves to itself, with or without the #", () => {
  assert.equal(resolveSection(IDS, "#section-about"), "section-about");
  assert.equal(resolveSection(IDS, "section-about"), "section-about");
});

test("an unknown hash falls back to the first section instead of blanking the pane", () => {
  // The failure this prevents: a stale link, a hand-typed hash or a leftover
  // #ventana-perfil from phase 2 hides every section and leaves the middle
  // window empty, with no way to tell it is not just slow.
  assert.equal(resolveSection(IDS, "#section-nope"), "section-home");
  assert.equal(resolveSection(IDS, "#ventana-perfil"), "section-home");
});

test("a window id is not a section id", () => {
  // #window-main is a real element on the page, so `document.getElementById`
  // would have found it. Only the section list counts.
  assert.equal(resolveSection(IDS, "#window-main"), "section-home");
});

test("an empty or missing hash resolves to the first section", () => {
  assert.equal(resolveSection(IDS, ""), "section-home");
  assert.equal(resolveSection(IDS, "#"), "section-home");
  assert.equal(resolveSection(IDS, undefined), "section-home");
  assert.equal(resolveSection(IDS, null), "section-home");
});

test("a project section marks Projects as the current Menu entry", () => {
  assert.equal(navFor("section-project-this-desktop"), "section-projects");
});

test("any other section marks itself", () => {
  assert.equal(navFor("section-about"), "section-about");
  assert.equal(navFor("section-projects"), "section-projects");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/components/xp/sections.test.mjs`
Expected: FAIL with `Cannot find module '.../sections.mjs'`

- [ ] **Step 3: Write the implementation**

Create `src/components/xp/sections.mjs`:

```js
/**
 * The sections of the middle window, and the arithmetic of choosing one.
 *
 * No DOM on purpose: the switcher lives in the <script> of Sections.astro, and
 * what is here is the part that can go wrong silently — a hash nobody
 * recognises leaving the reading pane blank, or the Menu drifting out of step
 * with what actually got rendered.
 */

/**
 * The Menu, in order. It is the single source of truth: `Sections.astro`
 * renders the fixed sections from this list and `Nav.astro` renders the links
 * from it, so a typo cannot put a Menu entry in front of a section that does
 * not exist.
 */
export const NAV = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Projects" },
  { id: "about", label: "About me" },
  { id: "blog", label: "Blog" },
];

/** A section's element id, which is also its hash. */
export const sectionId = (name) => `section-${name}`;

/** A project's section id, derived from its filename, as phase 2 did for windows. */
export const projectSectionId = (fileId) => sectionId(`project-${fileId}`);

/**
 * Which section a hash asks for, guaranteed to be one that exists.
 *
 * Anything unrecognised — a stale link, a typo, a leftover `#ventana-perfil`
 * from phase 2, or the id of a window rather than a section — falls back to the
 * first section. Without this the switcher hides all of them and the middle
 * window is blank, which reads as a broken site rather than a bad link.
 */
export function resolveSection(ids, hash) {
  const wanted = String(hash ?? "").replace(/^#/, "");
  return ids.includes(wanted) ? wanted : ids[0];
}

/**
 * Which Menu entry is the current one for a given section.
 *
 * A project is reached from Projects and belongs under it, so drilling into one
 * must not leave the Menu with nothing highlighted.
 */
export const navFor = (id) =>
  id.startsWith(sectionId("project-")) ? sectionId("projects") : id;

/**
 * How each `status` from the content schema reads.
 *
 * It used to live in `projects.mjs`, whose stated reason for existing was
 * keeping a window id from drifting between the page that minted it and the
 * index that linked it. Phase 3 has no per-project window, so that module has
 * nothing left to hold and Task 4 deletes it.
 */
export const STATUS = {
  live: "In use",
  wip: "In progress",
  archived: "Archived",
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test src/components/xp/sections.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/xp/sections.mjs src/components/xp/sections.test.mjs
git commit -m "Añade el registro de secciones de la ventana central

Puro y con test porque el fallo que evita es mudo: un hash que nadie
reconoce esconde todas las secciones y deja el panel en blanco, que se
lee como un sitio roto y no como un enlace malo."
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
```

---

### Task 2: Entrance timing and row layout

Two pure functions in the module that already owns window arithmetic and already has tests.

**Files:**
- Modify: `src/components/xp/windows.mjs` (append at the end)
- Modify: `src/components/xp/windows.test.mjs` (append at the end)

**Interfaces:**
- Consumes: `clampPosition(win, desk)` and `KEEP_VISIBLE` from Task 0 (already in the file).
- Produces:
  - `TASKBAR_ENTER_MS = 800`, `ENTER_BASE = 900`, `ENTER_STEP = 260`
  - `enterDelay(order: number) => number` — ms of animation delay for the window at that position in the sequence.
  - `ROW_GAP = 16`, `ROW_MARGIN = 16`
  - `rowPositions(sizes: Array<{w,h}>, desk: {vw,vh,barH}) => Array<{x,y}> | null` — `null` means the row does not fit and the caller must fall back to `cascadePosition`.

- [ ] **Step 1: Write the failing test**

In `src/components/xp/windows.test.mjs`, add the seven new names to the
**existing** `import { … } from "./windows.mjs"` at the top of the file — do not
add a second import statement for the same module:

```js
import {
  cascadePosition,
  clampPosition,
  initialPosition,
  enterDelay,
  rowPositions,
  CASCADE_STEP,
  CASCADE_WRAP,
  ENTER_BASE,
  ENTER_STEP,
  KEEP_VISIBLE,
  ROW_GAP,
  ROW_MARGIN,
  TASKBAR_ENTER_MS,
} from "./windows.mjs";
```

Then append the new tests to the end of the file. `DESK` and `KEEP_VISIBLE` are
already defined at the top and are reused:

```js
// The three windows of phase 3, in Menu / Main / Contact order.
const ROW = [
  { w: 200, h: 260 },
  { w: 700, h: 600 },
  { w: 240, h: 300 },
];

test("the first window waits for the taskbar to finish rising", () => {
  // The whole point of the sequence: desktop, then the bar, then the windows.
  // If the first window overlaps the bar's 800ms rise they arrive together and
  // it reads as an image instead of a machine starting up (phase 1 §8).
  assert.ok(enterDelay(0) > TASKBAR_ENTER_MS, `${enterDelay(0)} <= ${TASKBAR_ENTER_MS}`);
  assert.equal(enterDelay(0), ENTER_BASE);
});

test("each window in the sequence waits one step longer than the last", () => {
  assert.equal(enterDelay(1) - enterDelay(0), ENTER_STEP);
  assert.equal(enterDelay(2) - enterDelay(1), ENTER_STEP);
  for (let i = 1; i < 6; i++) {
    assert.ok(enterDelay(i) > enterDelay(i - 1), `i=${i}`);
  }
});

test("the row lays the three windows out with an exact gap between them", () => {
  const p = rowPositions(ROW, DESK);
  assert.ok(p, "the row should fit at 1440x900");
  assert.equal(p[1].x - (p[0].x + ROW[0].w), ROW_GAP);
  assert.equal(p[2].x - (p[1].x + ROW[1].w), ROW_GAP);
});

test("the row is centred and its tops are aligned", () => {
  const p = rowPositions(ROW, DESK);
  const left = p[0].x;
  const right = DESK.vw - (p[2].x + ROW[2].w);
  assert.ok(Math.abs(left - right) <= 1, `left=${left} right=${right}`);
  assert.equal(p[0].y, p[1].y);
  assert.equal(p[1].y, p[2].y);
});

test("the row sits above centre, like a window Windows just opened", () => {
  const p = rowPositions(ROW, DESK);
  const tallest = Math.max(...ROW.map((s) => s.h));
  assert.ok(p[0].y < (DESK.vh - DESK.barH - tallest) / 2, `y=${p[0].y}`);
});

test("the row gives up rather than squeezing, and says so with null", () => {
  // The caller falls back to cascadePosition. Shrinking the windows to fit
  // would leave a reading pane too narrow to read, which is worse.
  assert.equal(rowPositions(ROW, { vw: 900, vh: 900, barH: 40 }), null);
});

test("the threshold is the row plus one margin each side, to the pixel", () => {
  const total = ROW.reduce((n, s) => n + s.w, 0) + ROW_GAP * (ROW.length - 1);
  const min = total + ROW_MARGIN * 2;
  assert.ok(rowPositions(ROW, { vw: min, vh: 900, barH: 40 }), `should fit at ${min}`);
  assert.equal(rowPositions(ROW, { vw: min - 1, vh: 900, barH: 40 }), null);
});

test("on a short desktop the row still lands inside the clamp", () => {
  const short = { vw: 1440, vh: 420, barH: 40 };
  const p = rowPositions(ROW, short);
  assert.ok(p, "the row fits horizontally");
  for (const q of p) {
    assert.ok(q.y >= 0, `y=${q.y}`);
    assert.ok(q.y <= short.vh - short.barH - KEEP_VISIBLE, `y=${q.y}`);
  }
});

test("a row of one is just a centred window", () => {
  const p = rowPositions([{ w: 700, h: 600 }], DESK);
  assert.equal(p.length, 1);
  assert.equal(p[0].x, (DESK.vw - 700) / 2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/components/xp/windows.test.mjs`
Expected: FAIL — `enterDelay is not a function` / `rowPositions is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/components/xp/windows.mjs`:

```js
/**
 * How long the taskbar takes to finish arriving: 400ms waiting plus 400ms
 * rising (phase 1 §8).
 *
 * ⚠️ The two numbers live in the CSS of `Taskbar.astro`. This constant exists so
 * the window sequence can be written against them and a test can hold the order
 * — desktop, then the bar, then the windows — rather than three magic numbers
 * agreeing by luck. Change the bar's timing and change this too.
 */
export const TASKBAR_ENTER_MS = 800;

/** When the first window arrives: just after the bar settles. */
export const ENTER_BASE = TASKBAR_ENTER_MS + 100;

/** The gap between one window arriving and the next. */
export const ENTER_STEP = 260;

/** The animation delay, in ms, for the window at position `order` in the sequence. */
export const enterDelay = (order) => ENTER_BASE + ENTER_STEP * order;

/** Gap between two windows of the row, in px. */
export const ROW_GAP = 16;

/** The least space left at each end of the row, in px. */
export const ROW_MARGIN = 16;

/**
 * Lays windows out as one centred row with their tops aligned.
 *
 * Returns `null` when the row plus its margins does not fit: the caller falls
 * back to `cascadePosition`. It gives up instead of shrinking the windows on
 * purpose — a reading pane narrow enough to fit a small laptop is not worth
 * reading, and a cascade is a layout the visitor can fix by dragging.
 *
 * @param {Array<{w:number,h:number}>} sizes  in row order, left to right
 * @param {{vw:number,vh:number,barH:number}} desk
 * @returns {Array<{x:number,y:number}>|null}
 */
export function rowPositions(sizes, desk) {
  const total =
    sizes.reduce((n, s) => n + s.w, 0) + ROW_GAP * Math.max(0, sizes.length - 1);
  if (total + ROW_MARGIN * 2 > desk.vw) return null;

  const bottom = desk.vh - desk.barH;
  const tallest = Math.max(...sizes.map((s) => s.h));
  // The same 0.35 as `initialPosition`: above centre, where Windows opens a
  // window. Measured off the tallest so the aligned tops stay put whichever
  // window happens to be the tall one.
  const y = Math.round((bottom - tallest) * 0.35);

  let x = Math.round((desk.vw - total) / 2);
  return sizes.map((s) => {
    // Through the same clamp as dragging. Horizontally it is a no-op — the row
    // is known to fit — so the gaps survive; vertically it is what keeps a
    // short desktop from putting the title bars under the taskbar.
    const p = clampPosition({ ...s, x, y }, desk);
    x += s.w + ROW_GAP;
    return p;
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test src/components/xp/windows.test.mjs`
Expected: PASS, 23 tests (14 existing + 9 new).

- [ ] **Step 5: Commit**

```bash
git add src/components/xp/windows.mjs src/components/xp/windows.test.mjs
git commit -m "Añade los tiempos de entrada y la fila de tres ventanas

rowPositions devuelve null en vez de encoger las ventanas: un panel de
lectura estrecho no se lee, y una cascada el visitante la arregla
arrastrando. El test fija el umbral al píxel y que la barra de tareas
termina de subir antes de que llegue la primera ventana."
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
```

---

### Task 3: The window frame learns the sequence, the row and its own title

The site keeps working with phase 2's five windows throughout this task. What changes: the entrance plays on every visit instead of only after the boot screen, a window can be told to retitle itself, and closing one no longer strands it.

**Files:**
- Modify: `src/components/xp/Window.astro`
- Modify: `src/components/xp/Taskbar.astro` (the entrance block at the end of `<style>`)

**Interfaces:**
- Consumes: `enterDelay`, `rowPositions`, `cascadePosition`, `clampPosition`, `initialPosition` from `./windows.mjs`.
- Produces:
  - `Window.astro` props gain `order?: number` (default `0`), `row?: boolean` (default `false`), `tight?: boolean` (default `false`), `x?: number`, `y?: number`.
  - A `xp:title` `CustomEvent` listener on each `.xp-window` element: `el.dispatchEvent(new CustomEvent("xp:title", { detail: "Projects" }))` retitles the title bar **and** the taskbar button.

- [ ] **Step 1: Add the new props and the entrance delay to the frontmatter**

In `src/components/xp/Window.astro`, replace the import line and the `Props` interface and the `pos` constant:

```astro
import { enterDelay, initialPosition } from "./windows.mjs";
import { HEIGHT as BAR_H } from "./taskbar-colors.mjs";

interface Props {
  /** Title of the title bar and of the taskbar button. */
  title: string;
  /** Unique identifier. It is what links point at: `href="#id"`. */
  id: string;
  width?: number;
  height?: number;
  /** Whether it opens by itself on load. */
  open?: boolean;
  /** Position in the arrival sequence: 0 arrives first. */
  order?: number;
  /** Whether it takes part in the row layout (phase 3 §4.1). */
  row?: boolean;
  /** Half the body padding. For the small windows, where 22px eats the content. */
  tight?: boolean;
  /** Build-time position. Overrides the centred default; the script re-lays it anyway. */
  x?: number;
  y?: number;
}

const {
  title,
  id,
  width = 720,
  height = 520,
  open = false,
  order = 0,
  row = false,
  tight = false,
  x,
  y,
} = Astro.props;

/* Build-time position, computed against a 1440x900 reference desktop. In
   desktop mode the script recomputes it against the real screen; in stacked
   mode it is not used. Passing x/y explicitly is how `index.astro` hands over
   the row it already knows, so a returning visitor — who gets no boot screen —
   does not see the windows land centred and then jump. */
const fallback = initialPosition({ w: width, h: height }, { vw: 1440, vh: 900, barH: BAR_H });
const pos = { x: x ?? fallback.x, y: y ?? fallback.y };
```

- [ ] **Step 2: Add the new attributes to the markup**

Replace the opening `<section>` tag:

```astro
<section
  class="xp-window"
  id={id}
  data-open={open ? "true" : "false"}
  data-row={row ? "true" : undefined}
  data-tight={tight ? "true" : undefined}
  tabindex="-1"
  style={`--x:${pos.x}px;--y:${pos.y}px;--w:${width}px;--h:${height}px;--bar-h:${BAR_H}px;--enter-delay:${enterDelay(order)}ms`}
  aria-labelledby={`${id}-title`}
>
```

- [ ] **Step 3: Replace the entrance transition with the animation**

In `Window.astro`'s `<style>`, delete the whole `/* ── The opening ── */` block (from the comment down to and including the `@media (prefers-reduced-motion: reduce)` block at the end of the file) and put this in its place:

```css
  /* ── The arrival ──────────────────────────────────────────────────────── */
  /* `html:not([data-boot])` is the entire trick, and it is why this is an
     animation now and was a transition in phase 2.

     A CSS animation starts when the element FIRST MATCHES the rule. While the
     boot screen is up the rule does not match, so nothing is running; the
     moment `Boot.astro` removes the attribute the element starts matching and
     the delay is counted from THERE. That is what phase 2 could not do with
     @keyframes — an animation with a delay counts from page load, so it would
     have played behind the boot screen — and it is what a transition could not
     do either, because a returning visitor gets no boot screen and therefore no
     attribute change to transition off. Now both visits get the same sequence.

     `both` fill: before the delay the window holds the `from` state, so it is
     invisible while the script re-lays it against the real viewport, and the
     correction is never seen.

     `.xp-arrived` and `html.js`: taking an element out of `display: none`
     RESTARTS every animation named on it, so without a way to stop matching
     the rule, closing and reopening (or minimising and restoring) a window
     would replay the whole entrance and hold it at opacity 0 for the delay
     again. The script adds `.xp-arrived` once the sequence is over, and from
     then on the rule stops applying — nothing moves when it does, because the
     animation's `to` state is already the window's natural, un-animated one.
     `html.js` is not decoration either: without it, a no-JS visitor — who
     never gets `.xp-arrived` — would sit through a delay the animation exists
     to hide a script re-laying, which they have no script to run.

     This fails open in every direction that is under this rule's own control:
     there is no base `opacity: 0` for a failed script to undo, the hiding is
     the animation's own backwards fill plus one rule that only applies while
     the boot screen is on top, and under reduced motion neither rule exists so
     every window is simply visible. The one thing it depends on outside itself
     is `Boot.astro` removing `data-boot` — phase 1 and 2 had the same
     dependency, and `Boot.astro` installs its exit listeners before anything
     that can throw, precisely so that removal is guaranteed. */
  @media (prefers-reduced-motion: no-preference) {
    :global(html[data-boot]) .xp-window {
      opacity: 0;
    }
    :global(html.js:not([data-boot]):not(.xp-arrived)) .xp-window {
      animation: xp-window-enter 260ms cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay, 900ms)
        both;
    }
    @keyframes xp-window-enter {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(12px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  }
```

Also restore `transform-origin: 50% 100%` on the base `.xp-window` rule (outside this media query, next to its other base rules): it was in phase 2's block and is what makes the animation scale from the bottom edge instead of the centre.

- [ ] **Step 4: Give the small windows a tighter body**

In `Window.astro`'s `<style>`, immediately after the `.xp-winbody` rule, add:

```css
  /* 22px of padding inside a 200px window leaves 156px of content. The Menu and
     the Contact card ask for this; the reading pane does not. */
  .xp-window[data-tight] .xp-winbody {
    padding: 8px;
  }
```

- [ ] **Step 5: Make the taskbar button outlive a close, and add the title event**

In `Window.astro`'s `<script>`, inside the `forEach`, replace the `close` function and the `task.addEventListener("click", …)` handler, and add the title listener. The `close` function becomes:

```ts
    const close = () => {
      win.dataset.open = "false";
      win.classList.remove("is-min", "is-front");
      // The button does NOT go (phase 3 §4.3). In XP it would, but in XP there
      // are desktop icons and a Start menu to get the window back; here there is
      // nothing else, and closing the Menu window under XP's rule would leave a
      // visitor with a site and no way to navigate it until they reloaded.
      task.classList.remove("xp-task-active");
      task.focus();
    };
```

The taskbar button handler becomes:

```ts
    // A click on the taskbar button does what it does in Windows, plus one
    // thing XP does not need: it also brings back a window that was closed.
    task.addEventListener("click", () => {
      const outOfSight =
        win.dataset.open !== "true" || win.classList.contains("is-min");
      if (outOfSight || !win.classList.contains("is-front")) {
        win.dataset.open = "true";
        restore();
        toFront();
        win.focus();
      } else {
        minimise();
      }
    });
```

And add, next to the other listeners:

```ts
    // The only way to retitle a window from outside. It has to go through here
    // because the taskbar button's text is copied once at start-up: retitling
    // just the title bar leaves the button saying something else.
    win.addEventListener("xp:title", (e) => {
      const next = (e as CustomEvent<string>).detail;
      if (!next) return;
      titleText.textContent = next;
      task.textContent = next;
    });
```

- [ ] **Step 6: Place the row at start-up**

In `Window.astro`'s `<script>`, change the import line to include `rowPositions`:

```ts
  import { cascadePosition, clampPosition, rowPositions } from "./windows.mjs";
```

Then replace the `// ── Start-up ──` block at the end of the `forEach` with:

```ts
    // ── Start-up ──────────────────────────────────────────────────────────
    windows.set(win.id, open);

    if (win.dataset.open === "true" && DESKTOP.matches) {
      // Counted BEFORE appending, as phase 2 did: it is the cascade's index,
      // and it has to be different for each window. Counting open windows
      // instead would give every one of them the same number at start-up,
      // because they are all already `data-open="true"` in the HTML, and the
      // cascade would stack them on one spot.
      const alreadyPlaced = tasks?.children.length ?? 0;
      tasks?.appendChild(task);
      move(placement(alreadyPlaced));
      toFront();
    }
  });

  /**
   * The arrival happens once, and the marker that ends it has to be anchored to
   * the animation and not to a clock. The animation starts when `Boot.astro`
   * removes `data-boot`, which on a first visit is whenever the visitor presses
   * a key — `AUTO_MS` is 0, so the boot screen waits as long as it takes. A
   * timer started at page load fires long before that and switches the arrival
   * off before it ever runs.
   *
   * Only the windows that are open at start-up are counted: a window that is
   * `display: none` runs no animation, so waiting for one from it would wait
   * for ever.
   *
   * Why the marker exists at all: taking an element out of `display: none`
   * RESTARTS every animation named on it, so without this a window the visitor
   * just reopened would sit invisible for the whole delay before fading in.
   * Removing the rule afterwards is not visible — the animation's `to` state is
   * the window's natural state.
   */
  const arriving = [...document.querySelectorAll<HTMLElement>('.xp-window[data-open="true"]')];
  let pending = arriving.length;
  const arrived = () => document.documentElement.classList.add("xp-arrived");
  if (!pending) arrived();
  for (const w of arriving) {
    w.addEventListener("animationend", (e) => {
      if ((e as AnimationEvent).animationName !== "xp-window-enter") return;
      if (pending > 0 && --pending === 0) arrived();
    });
  }

  /**
   * Where a window goes when it first appears.
   *
   * Row windows are laid out together: each one reads every `[data-row]` window
   * in DOM order, computes the whole row and takes its own slot. Doing the same
   * arithmetic three times is cheaper than a shared layout pass and keeps each
   * window's script self-contained.
   */
  function placeRow(win: HTMLElement): { x: number; y: number } | null {
    const row = [...document.querySelectorAll<HTMLElement>('.xp-window[data-row="true"]')];
    const index = row.indexOf(win);
    if (index < 0) return null;
    // The authored --w/--h and not offsetWidth/offsetHeight: those are correct
    // even while the window is display:none or mid-animation, and they are the
    // exact numbers index.astro measured against when it computed the
    // build-time row.
    const sizes = row.map((w) => ({
      w: parseFloat(getComputedStyle(w).getPropertyValue("--w")) || w.offsetWidth,
      h: parseFloat(getComputedStyle(w).getPropertyValue("--h")) || w.offsetHeight,
    }));
    const positions = rowPositions(sizes, {
      vw: innerWidth,
      vh: innerHeight,
      barH: barHeight(),
    });
    return positions ? positions[index] : null;
  }
```

and inside the `forEach`, just above the start-up block, add the local helper it calls:

```ts
    /** The row if this window is in one and it fits; the cascade otherwise. */
    const placement = (index: number) =>
      placeRow(win) ?? cascadePosition(index, size(), desk());
```

- [ ] **Step 7: Give the taskbar the same arrival mechanism**

In `src/components/xp/Taskbar.astro`, replace the whole `/* ── The entrance ── */` block at the end of `<style>` (from the comment to the end of the file) with:

```css
  /* ── The arrival ─────────────────────────────────────────────────────────
     Same mechanism as the windows and for the same reason: an animation that
     starts when the element first matches `html:not([data-boot])`, so it runs
     when the boot screen leaves on a first visit AND from the first paint on a
     repeat visit, which has no boot screen to leave. With phase 2's transition
     a returning visitor found the bar already in place and the "desktop, then
     the bar, then the windows" beat only existed once per browser.

     The 400ms delay is what sells the scene (phase 1 §8). Its total, 800ms, is
     `TASKBAR_ENTER_MS` in windows.mjs, which is what the window sequence is
     written against — change one and change the other. */
  @media (prefers-reduced-motion: no-preference) {
    :global(html[data-boot]) .xp-taskbar {
      transform: translateY(100%);
    }
    :global(html:not([data-boot])) .xp-taskbar {
      animation: xp-taskbar-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) 400ms both;
    }
    @keyframes xp-taskbar-enter {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }
  }
```

- [ ] **Step 8: Build and check nothing regressed**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints`, 23 tests passing, 2 pages built.

- [ ] **Step 9: Verify the arrival in the browser, on a repeat visit**

```bash
SP=/tmp/claude-1000/-home-adelg/c4f1a789-97f1-4be5-8657-b84634277f85/scratchpad
(pnpm preview --port 4321 > "$SP/preview.log" 2>&1 &) ; sleep 4
"/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu \
  --hide-scrollbars --force-color-profile=srgb --remote-debugging-port=9224 \
  --user-data-dir='C:\Users\adelg\AppData\Local\Temp\cdp-p3' about:blank > "$SP/chrome.log" 2>&1 &
sleep 4
```

Then write `$SP/arrival.mjs`:

```js
const base = "http://127.0.0.1:9224";
const page = (await (await fetch(`${base}/json/list`)).json()).find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (m) => { const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) { const p = pending.get(msg.id); pending.delete(msg.id);
    msg.error ? p.reject(new Error(JSON.stringify(msg.error))) : p.resolve(msg.result); } };
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params })); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evalJs = (e) => send("Runtime.evaluate", { expression: e, returnByValue: true }).then((r) => r.result.value);
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
// Mark the boot screen as already seen: this is the REPEAT visit, the one
// phase 2's transition never animated.
await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
await sleep(600);
await evalJs(`localStorage.setItem('boot_seen','1')`);
await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
await sleep(650);
console.log("a los ~650ms", await evalJs(`JSON.stringify({
  boot: !!document.getElementById('boot'),
  barra: getComputedStyle(document.querySelector('.xp-taskbar')).transform,
  opacidades: [...document.querySelectorAll('.xp-window')].map(w => +getComputedStyle(w).opacity),
})`));
await sleep(1400);
console.log("a los ~2050ms", await evalJs(`JSON.stringify({
  opacidades: [...document.querySelectorAll('.xp-window')].map(w => +getComputedStyle(w).opacity),
})`));
ws.close();
```

Run: `node "$SP/arrival.mjs"`
Expected: at ~650ms every window opacity is `0` and the bar is still partly down; at ~2050ms the open window's opacity is `1`. That is the proof the sequence now runs without a boot screen.

- [ ] **Step 10: Verify closing no longer strands a window**

Append to a copy of the script above, or run in the same session:

```js
console.log(await evalJs(`(() => {
  const w = document.getElementById('window-projects');
  document.querySelector('a[href="#window-projects"]').click();
  const antes = document.querySelectorAll('.xp-task').length;
  w.querySelector('.xp-close').click();
  const despues = document.querySelectorAll('.xp-task').length;
  const boton = [...document.querySelectorAll('.xp-task')].find(b => b.textContent === 'Projects');
  boton?.click();
  return JSON.stringify({ antes, despues, vuelve: w.dataset.open });
})()`));
```

Expected: `despues === antes` (the button survived) and `vuelve === "true"` (it came back).

- [ ] **Step 11: Kill the servers**

```bash
pkill -f "chrome.exe.*9224"; ps aux | grep "astro.mjs preview" | grep -v grep | awk '{print $2}' | xargs -r kill
sleep 2; ss -ltn | grep -E "4321|9224" || echo "puertos libres"
```

- [ ] **Step 12: Commit**

```bash
git add src/components/xp/Window.astro src/components/xp/Taskbar.astro
git commit -m "La entrada pasa de transición a animación y suena en cada visita

html:not([data-boot]) es todo el truco: una animación empieza cuando el
elemento EMPIEZA A CASAR con la regla, así que arranca cuando el
arranque se va y también en la primera pintura de quien ya lo vio. De
paso el fill 'both' esconde la ventana mientras el script la recoloca,
que era un salto visible al volver al sitio.

Cerrar ya no se lleva el botón de la barra: en XP sí, pero en XP hay
iconos y menú Inicio para recuperar la ventana y aquí no hay nada más."
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
```

---

### Task 4: The middle window becomes a content pane

At the end of this task the site has two windows: phase 2's welcome window, whose shortcuts now switch the pane instead of opening windows, and the new pane.

**Files:**
- Create: `src/components/xp/Sections.astro`
- Rename: `src/components/xp/Welcome.astro` → `src/components/xp/Home.astro`
- Modify: `src/components/xp/Home.astro` (drop the shortcut grid, keep the intro and contact row; the colophon stays for now and moves in Task 5)
- Modify: `src/components/xp/Projects.astro` (link to sections, not to windows)
- Modify: `src/components/xp/Project.astro` (add the back link, import `STATUS` from its new home)
- Delete: `src/components/xp/projects.mjs`
- Modify: `src/styles/xp-doc.css` (append the section rules)
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `NAV`, `sectionId`, `projectSectionId`, `resolveSection`, `navFor` from `./sections.mjs`; the `xp:title` event from Task 3.
- Produces: a middle window with id `window-main` containing one `<section class="xp-section" id="section-…" data-title="…" tabindex="-1">` per section, and a switcher driven by `hashchange`.

- [ ] **Step 1: Rename the welcome component and cut the shortcut grid**

```bash
git mv src/components/xp/Welcome.astro src/components/xp/Home.astro
```

In `src/components/xp/Home.astro`: change the header comment to describe a section rather than a window, delete the `projects`/`entries` `getCollection` calls, the `plural` helper, the `shortcuts` array and the whole `<ul class="shortcuts">` block. Keep the `<h1>`, the `lede`, the descriptive paragraph, the `<hr />`, the contact `row` and the colophon. The frontmatter reduces to:

```astro
---
/**
 * The Home section: the first thing the reading pane shows.
 *
 * It used to be a window of its own and the site's only navigation. The Menu
 * window is that now, so what is left here is the introduction — the shortcut
 * grid moved out rather than being duplicated.
 */
import { SITE, SOCIAL } from "../../consts";

const year = new Date().getFullYear();
---
```

- [ ] **Step 2a: Point the project index at sections and retire `projects.mjs`**

`Projects.astro` still links to `#window-project-<id>`, a window id that phase 3
deletes — the link would resolve to nothing. Change its import and its `href`:

```astro
import { STATUS, projectSectionId } from "./sections.mjs";
```

```astro
            <a href={`#${projectSectionId(p.id)}`}>{p.data.title}</a>
```

and update its header comment, whose second paragraph describes window ids that
no longer exist:

```astro
/**
 * The project index, one section of the reading pane. Each title opens that
 * project in the same pane, which is rendered at build time just like this one
 * (phase 1 §13: the content is not generated by JavaScript).
 *
 * The section id is composed by `projectSectionId()` in one single place,
 * because `Sections.astro` mints it and this file links it: if the two drift
 * apart the link stops showing anything and the build does not fail.
 */
```

With `windowIdFor` gone, `projects.mjs` holds only `STATUS`, which Task 1 moved
into `sections.mjs`. Delete the module and repoint its other importer:

```bash
git rm src/components/xp/projects.mjs
```

In `src/components/xp/Project.astro` change `import { STATUS } from "./projects.mjs";`
to import from `./sections.mjs` (combined with the next step's import).

- [ ] **Step 2b: Add the back link to a project**

In `src/components/xp/Project.astro`, the import line becomes:

```astro
import { STATUS, sectionId } from "./sections.mjs";
```

and the link goes above the `<h1>`:

```astro
<div class="xp-doc">
  {/* A real anchor, like every other bit of navigation here: with JavaScript the
      switcher takes it, without it the page jumps to the Projects section,
      which is visible. */}
  <p class="note back"><a href={`#${sectionId("projects")}`}>← Projects</a></p>
  <h1>{title}</h1>
```

- [ ] **Step 3: Write `Sections.astro`**

Create `src/components/xp/Sections.astro`:

```astro
---
/**
 * The contents of the reading pane: every section, rendered into the build.
 *
 * Phase 1 §13 still governs — if JavaScript produced these, a crawler would see
 * an empty pane. The script only decides which one is visible. Without it every
 * section is on the page, one after another, which is the whole no-JavaScript
 * story (phase 3 §6).
 *
 * The four fixed sections are rendered FROM `NAV`, not written out by hand, so a
 * Menu entry cannot end up pointing at a section that does not exist.
 *
 * Spec: docs/superpowers/specs/2026-08-16-xp-desktop-phase3-design.md
 */
import { getCollection } from "astro:content";
import Home from "./Home.astro";
import Projects from "./Projects.astro";
import About from "./About.astro";
import Blog from "./Blog.astro";
import Project from "./Project.astro";
import { NAV, projectSectionId, sectionId } from "./sections.mjs";

/* Annotated because `FIXED[entry.id]` indexes with a `string`, and under
   `astro/tsconfigs/strict` an un-annotated object literal makes that an
   implicit-any index error that fails `astro check`. All four are Astro
   component factories with no required props, so they share one type. */
const FIXED: Record<string, typeof Home> = {
  home: Home,
  projects: Projects,
  about: About,
  blog: Blog,
};

const projects = (
  await getCollection("projects", ({ data }) => (import.meta.env.PROD ? !data.draft : true))
).sort((a, b) => a.data.order - b.data.order || b.data.year - a.data.year);
---

{
  NAV.map((entry) => {
    const Body = FIXED[entry.id];
    return (
      <section
        class="xp-section"
        id={sectionId(entry.id)}
        data-title={entry.label}
        tabindex="-1"
      >
        <Body />
      </section>
    );
  })
}

{
  projects.map((p) => (
    <section
      class="xp-section"
      id={projectSectionId(p.id)}
      data-title={p.data.title}
      tabindex="-1"
    >
      <Project project={p} />
    </section>
  ))
}

<script>
  import { navFor, resolveSection } from "./sections.mjs";

  const pane = document.getElementById("window-main");
  const sections = [...document.querySelectorAll<HTMLElement>("#window-main .xp-section")];
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".xp-navlink")];
  const ids = sections.map((s) => s.id);

  /**
   * Shows one section and hides the rest.
   *
   * Runs in BOTH modes, not just on a desktop: on a phone with JavaScript, one
   * section at a time beats a single column holding the entire site.
   *
   * `moveFocus` is false on the first call on purpose. Focusing an element
   * scrolls it into view, and nobody asked to be scrolled just for arriving.
   */
  function show(hash: string, moveFocus: boolean) {
    if (!sections.length) return;
    const target = resolveSection(ids, hash);
    const active = sections.find((s) => s.id === target);
    if (!active) return;

    for (const s of sections) s.hidden = s !== active;

    // Through the event and not by writing to `.xp-titletext` directly: the
    // taskbar button's text is a copy made at start-up and `Window.astro` is
    // what knows about it.
    const title = active.dataset.title;
    if (title) pane?.dispatchEvent(new CustomEvent("xp:title", { detail: title }));

    const current = `#${navFor(target)}`;
    for (const a of links) {
      if (a.getAttribute("href") === current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }

    if (moveFocus) active.focus();
  }

  // No click handler: the anchors set the hash themselves, which is what gives
  // the back button and shareable section links for free (phase 3 §3).
  addEventListener("hashchange", () => show(location.hash, true));

  // The FIRST show waits for DOMContentLoaded, which fires only after every
  // deferred module script has run. Astro does not promise an order between two
  // bundled component scripts, and this one dispatches `xp:title` at a window
  // whose listener lives in Window.astro's script: run first and the event goes
  // nowhere, so a deep link would land on the right section under the title
  // "Home". `hashchange` above is registered immediately — it cannot fire this
  // early anyway.
  const first = () => show(location.hash, false);
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", first);
  else first();
</script>
```

- [ ] **Step 4: Add the section styles**

Append to `src/styles/xp-doc.css`:

```css
/* ── The sections of the reading pane ──────────────────────────────────── */

/* Belt and braces over the UA's `[hidden] { display: none }`: the rule is easy
   to lose to any `display` set on an ancestor, and losing it means every
   section on screen at once. */
.xp-section[hidden] {
  display: none;
}
/* The switcher focuses the section so a screen reader lands on the new content.
   It is a container, not a control: no focus ring. */
.xp-section:focus {
  outline: none;
}
/* Only ever seen with JavaScript off, where every section is stacked. */
.xp-section + .xp-section {
  margin-top: 2rem;
  padding-top: 1.6rem;
  border-top: 1px solid #aca899;
}

.xp-doc .back {
  margin-bottom: 0.6rem;
}
```

- [ ] **Step 5: Wire the two windows**

Replace the body of `src/pages/index.astro` with:

```astro
---
/**
 * The site: a Windows XP desktop with the portfolio inside windows.
 *
 * Every window and every section is rendered here, at build time. The
 * JavaScript only opens, closes, drags and swaps — if it generated the content,
 * a search engine would see an empty desktop (phase 1 §13).
 *
 * Spec: docs/superpowers/specs/2026-08-16-xp-desktop-phase3-design.md
 */
import XP from "../layouts/XP.astro";
import Boot from "../components/Boot.astro";
import Window from "../components/xp/Window.astro";
import Welcome from "../components/xp/Home.astro";
import Sections from "../components/xp/Sections.astro";
---

<XP>
  <Boot slot="overlay" />

  {/* Temporary nav, deleted in Task 5 when the Menu window takes over. It lives
      here and NOT inside Home.astro on purpose: Home.astro renders inside
      `#section-home`, which the switcher hides the moment you navigate away,
      so a nav placed there would disappear with the first click. `xp-navlink`
      is the real class, so the aria-current wiring is exercised now. */}
  <Window id="window-welcome" title="Welcome to my page" width={720} height={560} order={0} open>
    <div class="xp-doc">
      <p class="row">
        <a class="xp-navlink" href="#section-home">Home</a>
        <a class="xp-navlink" href="#section-projects">Projects</a>
        <a class="xp-navlink" href="#section-about">About me</a>
        <a class="xp-navlink" href="#section-blog">Blog</a>
      </p>
    </div>
    <Welcome />
  </Window>

  <Window id="window-main" title="Home" width={700} height={600} order={1} open>
    <Sections />
  </Window>
</XP>
```

> This two-window state exists only so this task ends with a site that runs.
> Task 5 replaces the welcome window with the Menu and Contact windows.

- [ ] **Step 6: Build**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step 7: Verify switching, deep links, a stale hash and the back button**

Start the preview and Chrome as in Task 3, then run a script whose body is:

```js
await send("Page.navigate", { url: "http://127.0.0.1:4321/#section-project-this-desktop" });
await sleep(2200);
console.log("enlace profundo", await evalJs(`JSON.stringify({
  visible: [...document.querySelectorAll('.xp-section')].filter(s => !s.hidden).map(s => s.id),
  titulo: document.querySelector('#window-main .xp-titletext').textContent,
  boton: [...document.querySelectorAll('.xp-task')].map(b => b.textContent),
  actual: document.querySelector('[aria-current="page"]')?.getAttribute('href'),
})`));

await send("Page.navigate", { url: "http://127.0.0.1:4321/#section-nope" });
await sleep(2200);
console.log("hash muerto", await evalJs(`JSON.stringify({
  visible: [...document.querySelectorAll('.xp-section')].filter(s => !s.hidden).map(s => s.id),
})`));

await evalJs(`document.querySelector('a[href="#section-about"]').click()`);
await sleep(300);
await evalJs(`document.querySelector('a[href="#section-blog"]').click()`);
await sleep(300);
console.log("tras dos clics", await evalJs(`JSON.stringify({
  visible: [...document.querySelectorAll('.xp-section')].filter(s => !s.hidden).map(s => s.id),
  titulo: document.querySelector('#window-main .xp-titletext').textContent,
  boton: [...document.querySelectorAll('.xp-task')].map(b => b.textContent),
})`));
await send("Page.navigate", { url: "javascript:history.back()" });
await sleep(400);
console.log("atrás", await evalJs(`JSON.stringify({
  visible: [...document.querySelectorAll('.xp-section')].filter(s => !s.hidden).map(s => s.id),
})`));
```

Expected, in order:
- deep link → `["section-project-this-desktop"]`, title `This site: a Windows XP desktop`, a taskbar button with that same text, `aria-current` on `#section-projects`
- dead hash → `["section-home"]`, **not** an empty array
- after two clicks → `["section-blog"]`, title `Blog`, taskbar button `Blog`
- back → `["section-about"]`

- [ ] **Step 8: Verify the no-JavaScript story**

```js
await send("Emulation.setScriptExecutionDisabled", { value: true });
await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
await sleep(900);
await send("Emulation.setScriptExecutionDisabled", { value: false });
console.log("sin js", await evalJs(`JSON.stringify({
  secciones: document.querySelectorAll('.xp-section').length,
  ocultas: [...document.querySelectorAll('.xp-section')].filter(s => s.hidden).length,
  caracteres: document.body.innerText.length,
})`));
```

Expected: `ocultas === 0` and `caracteres` in the thousands.

- [ ] **Step 9: Kill the servers and commit**

```bash
pkill -f "chrome.exe.*9224"; ps aux | grep "astro.mjs preview" | grep -v grep | awk '{print $2}' | xargs -r kill
sleep 2; ss -ltn | grep -E "4321|9224" || echo "puertos libres"
git add -A
git commit -m "La ventana central pasa a ser un panel de secciones

Las secciones salen todas del build y el script solo decide cuál se ve.
Los enlaces NO se interceptan: el navegador pone el hash y el cambio va
por hashchange, así que el botón atrás y los enlaces a una sección
concreta salen gratis — que es justo lo que la fase 2 dio por perdido.

resolveSection cae en la primera sección ante un hash desconocido; sin
eso un enlace viejo deja el panel en blanco."
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
```

---

### Task 5: The Menu and Contact windows, and the row

**Files:**
- Create: `src/components/xp/Nav.astro`
- Create: `src/components/xp/Contact.astro`
- Modify: `src/consts.ts` (email first, and a display value per entry)
- Modify: `src/components/xp/Home.astro` (drop the temporary link row and the colophon)
- Modify: `src/components/xp/Window.astro` (delete the now-dead window-opening link handler)
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `NAV`, `sectionId` from `./sections.mjs`; `rowPositions`, `ROW_GAP` from `./windows.mjs`; `SITE`, `SOCIAL` from `../../consts`.
- Produces: `window-nav` (order 0), `window-main` (order 1), `window-contact` (order 2), all three `row`.

- [ ] **Step 1: Give the social entries something to display**

Replace `SOCIAL` in `src/consts.ts`:

```ts
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
```

- [ ] **Step 2: Write `Nav.astro`**

Create `src/components/xp/Nav.astro`:

```astro
---
/**
 * The Menu window: the site's navigation, and the only one there is.
 *
 * The entries are real `<a href="#section-…">` and the click is NOT
 * intercepted. The browser sets the hash, `Sections.astro` reacts to
 * `hashchange`, and the back button and shareable links come for free
 * (phase 3 §3). Without JavaScript they are anchors to sections that are all on
 * the page, so they jump.
 */
import { NAV, sectionId } from "./sections.mjs";
---

<nav class="xp-nav" aria-label="Sections">
  <ul>
    {
      NAV.map((entry) => (
        <li>
          <a class="xp-navlink" href={`#${sectionId(entry.id)}`}>
            {entry.label}
          </a>
        </li>
      ))
    }
  </ul>
</nav>

<style>
  .xp-nav ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .xp-nav li {
    margin: 0;
  }
  /* `:global` because the same class is used by the anchors this component
     renders AND read by the switcher in Sections.astro, which sets
     `aria-current` on them; the styling has to survive either way. */
  .xp-nav :global(.xp-navlink) {
    display: block;
    padding: 7px 10px;
    color: #000000;
    font-size: 0.95rem;
    text-decoration: none;
  }
  .xp-nav :global(.xp-navlink:visited) {
    color: #000000;
  }
  .xp-nav :global(.xp-navlink:hover) {
    background: #d8e6f8;
  }
  /* #316ac5 is the selection blue of Explorer, the same one the shortcuts in
     xp-doc.css already use for their focus ring. */
  .xp-nav :global(.xp-navlink[aria-current="page"]) {
    background: #316ac5;
    color: #ffffff;
    font-weight: bold;
  }
  .xp-nav :global(.xp-navlink:focus-visible) {
    outline: 2px solid #316ac5;
    outline-offset: -2px;
  }
  .xp-nav :global(.xp-navlink[aria-current="page"]:focus-visible) {
    outline-color: #ffffff;
  }
</style>
```

- [ ] **Step 3: Write `Contact.astro`**

Create `src/components/xp/Contact.astro`:

```astro
---
/**
 * The Contact window: the one pane in phase 3 whose content never changes.
 *
 * ⚠️ The colophon at the bottom is NOT decoration. The boot typeface is
 * CC BY-SA 4.0 and the credit is a licence obligation. This is its third home —
 * it was in the site footer, which the arcade removal deleted, then in the
 * welcome window, which phase 3 deleted — and it was nearly dropped both times.
 * It lives here because this is the only content that is always on screen: Home
 * is not, you can switch away from it.
 */
import { SITE, SOCIAL } from "../../consts";

const year = new Date().getFullYear();
---

<div class="xp-doc">
  <ul class="xp-contact">
    {
      SOCIAL.map((s) => (
        <li>
          <a href={s.href} rel={s.href.startsWith("http") ? "me noopener" : undefined}>
            {s.label}
          </a>
          <span>{s.value}</span>
        </li>
      ))
    }
  </ul>

  <hr />

  <p class="note colophon">
    © {year} {SITE.name}. Built with Astro, no analytics and no cookies.<br />
    Boot typeface: AcPlus IBM VGA 8x16 by <a
      href="https://int10h.org/oldschool-pc-fonts/"
      rel="noopener">VileR</a
    >, <a href="/fonts/LICENSE-oldschool-pc-fonts.txt">CC BY-SA 4.0</a>. The
    wallpaper and the Start flag are Microsoft's, here as a homage.
  </p>
</div>

<style>
  .xp-contact {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .xp-contact li {
    margin: 0 0 0.6rem;
  }
  .xp-contact span {
    display: block;
    font-size: 0.75rem;
    color: #6b675c;
    /* An address is one long unbreakable token in a 240px window. */
    overflow-wrap: anywhere;
  }
  .xp-doc .colophon {
    margin-bottom: 0;
    font-size: 0.7rem;
    line-height: 1.4;
  }
</style>
```

- [ ] **Step 4: Strip Home back to an introduction**

In `src/components/xp/Home.astro`, delete the colophon `<p class="note credits">`, the `<style>` block that targets `.credits`, and the now-unused `year` constant. Keep the `<h1>`, the `lede`, the descriptive paragraph, the `<hr />` and the contact `row` of `SOCIAL` links.

(The temporary `xp-navlink` row is not here — it lives in `index.astro`'s welcome window, which Step 6 replaces wholesale.)

- [ ] **Step 5: Delete the window-opening link handler**

In `src/components/xp/Window.astro`'s `<script>`, delete the `windows` Map declaration, the `open` function, the `opener` variable and its uses, the `windows.set(win.id, open)` line, and the whole `// ── The links that open windows ──` delegated `document.addEventListener("click", …)` block at the end.

Nothing links to a window any more — every link is a section hash — and the taskbar is now the way a closed window comes back (§4.3). Leaving the handler in place would be a mechanism with no callers that quietly does nothing the day someone adds a link to a window id.

`close()` already focuses `task`, so the focus return that `opener` provided is preserved and improved: focus lands on the button that brings the window back.

- [ ] **Step 6: Wire the three windows**

Replace `src/pages/index.astro`:

```astro
---
/**
 * The site: a Windows XP desktop with the portfolio inside three windows.
 *
 * Menu on the left, the reading pane in the middle, Contact on the right. They
 * arrive in that order after the boot screen (phase 3 §4.2). Every window and
 * every section is rendered here, at build time: if the JavaScript generated
 * them, a search engine would see an empty desktop (phase 1 §13).
 *
 * Spec: docs/superpowers/specs/2026-08-16-xp-desktop-phase3-design.md
 */
import XP from "../layouts/XP.astro";
import Boot from "../components/Boot.astro";
import Window from "../components/xp/Window.astro";
import Nav from "../components/xp/Nav.astro";
import Sections from "../components/xp/Sections.astro";
import Contact from "../components/xp/Contact.astro";
import { rowPositions } from "../components/xp/windows.mjs";
import { HEIGHT as BAR_H } from "../components/xp/taskbar-colors.mjs";

/* The row, computed here against the same 1440x900 reference the rest of the
   build uses, and handed to each window as x/y. The script recomputes it
   against the real viewport, but this is what gets painted first, and the
   closer it is the less there is to correct. */
const SIZES = [
  { w: 200, h: 260 },
  { w: 700, h: 600 },
  { w: 240, h: 300 },
];
const [nav, main, contact] = rowPositions(SIZES, { vw: 1440, vh: 900, barH: BAR_H }) ?? [];
---

<XP>
  <Boot slot="overlay" />

  <Window
    id="window-nav"
    title="Menu"
    width={SIZES[0].w}
    height={SIZES[0].h}
    x={nav?.x}
    y={nav?.y}
    order={0}
    row
    tight
    open
  >
    <Nav />
  </Window>

  {/* The title is the one the pane starts on; the switcher rewrites it. */}
  <Window
    id="window-main"
    title="Home"
    width={SIZES[1].w}
    height={SIZES[1].h}
    x={main?.x}
    y={main?.y}
    order={1}
    row
    open
  >
    <Sections />
  </Window>

  <Window
    id="window-contact"
    title="Contact"
    width={SIZES[2].w}
    height={SIZES[2].h}
    x={contact?.x}
    y={contact?.y}
    order={2}
    row
    tight
    open
  >
    <Contact />
  </Window>
</XP>
```

- [ ] **Step 7: Build**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step 8: Verify the row lands where the spec says**

With preview and Chrome running, at 1440x900 after the sequence has finished (`sleep 2200`):

```js
console.log(await evalJs(`JSON.stringify(
  ['window-nav','window-main','window-contact'].map(id => {
    const r = document.getElementById(id).getBoundingClientRect();
    return { id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width) };
  })
)`));
```

Expected: three equal `y`; `x[1] - (x[0] + w[0]) === 16` and `x[2] - (x[1] + w[1]) === 16`; the left margin equal to the right margin within 1px.

- [ ] **Step 9: Verify the stacked and reduced-motion modes**

```js
await send("Emulation.setDeviceMetricsOverride", { width: 400, height: 780, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
await sleep(2400);
console.log("apilado", await evalJs(`JSON.stringify({
  ventanas: [...document.querySelectorAll('.xp-window')].filter(w => w.offsetParent !== null).length,
  desborde: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  visible: [...document.querySelectorAll('.xp-section')].filter(s => !s.hidden).map(s => s.id),
})`));

await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:4321/" });
await sleep(250);
console.log("sin movimiento, a los 250ms", await evalJs(`JSON.stringify({
  opacidades: [...document.querySelectorAll('.xp-window')].map(w => +getComputedStyle(w).opacity),
})`));
await send("Emulation.setEmulatedMedia", { features: [] });
```

Expected: stacked → 3 windows visible, no horizontal overflow, exactly one section visible (the switcher runs in both modes, phase 3 §5). Reduced motion → every opacity is `1` at 250ms, i.e. no animation and nothing waiting on a delay.

- [ ] **Step 10: Kill the servers and commit**

```bash
pkill -f "chrome.exe.*9224"; ps aux | grep "astro.mjs preview" | grep -v grep | awk '{print $2}' | xargs -r kill
sleep 2; ss -ltn | grep -E "4321|9224" || echo "puertos libres"
git add -A
git commit -m "Tres ventanas: menú, panel de lectura y contacto

Llegan en ese orden después del arranque. La fila la calcula
rowPositions y si no cabe se cae a la cascada, que ya existía.

El colofón de la fuente del arranque se muda al contacto: es una
obligación de licencia y es el único panel que no cambia nunca. Va con
comentario porque es la tercera vez que un rediseño se lo lleva por
delante.

Se borra el manejador de enlaces que abría ventanas: ya no hay ninguno,
todos los enlaces son secciones, y la barra de tareas es lo que
devuelve una ventana cerrada."
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
```

---

### Task 6: Documentation, final verification and ship

**Files:**
- Modify: `README.md` (the *Routes*, *Structure* and *The windows* sections)
- Modify: `src/content/projects/this-desktop.md` (the project describes the site, and the site changed)

- [ ] **Step 1: Update the README's route table**

Add a row under the existing table in *Routes*:

```markdown
| `/#section-<name>` | A section of the reading pane. `home`, `projects`, `about`, `blog`, or `project-<filename>`. Shareable and back-button friendly; not a separate URL, so not in the sitemap |
```

- [ ] **Step 2: Update the README's structure tree**

In *Structure*, replace the `xp/` component list with:

```
│   └── xp/
│       ├── Window.astro      the frame and the window manager
│       ├── windows.mjs       position, row and entrance arithmetic (with tests)
│       ├── Taskbar.astro     taskbar + clock
│       ├── taskbar-colors.mjs  measured colours (with tests)
│       ├── sections.mjs      the Menu and the section registry (with tests)
│       ├── Nav.astro         the Menu window
│       ├── Sections.astro    the reading pane and its switcher
│       ├── Contact.astro     the Contact window, and the licence colophon
│       └── Home | Projects | Project | About | Blog
```

- [ ] **Step 3: Rewrite the README's "The windows" section**

Replace it with a version whose four bullets are the four things phase 3 can break:

```markdown
## The windows

Three of them: `Menu` on the left, the reading pane in the middle, `Contact` on
the right. They arrive in that order after the boot screen. `Contact` never
changes; the Menu swaps what the middle one shows.

Four things that break by themselves if left unattended:

- **Position always goes through `clampPosition`** (`windows.mjs`, with tests).
  The classic failure of a homemade manager is letting you drag until the title
  bar is off the screen. `KEEP_VISIBLE` is 110px and not 60 because the three
  buttons take ~70 at the right end of the bar.
- **`rowPositions` returns `null` rather than squeezing.** Below 1204px of
  desktop width the row does not fit and the three windows cascade instead. A
  reading pane narrow enough to fit a small laptop is not worth reading.
- **Closing keeps the taskbar button.** XP removes it, but XP has desktop icons
  and a Start menu to get the window back; here there is nothing else, and the
  navigation lives inside a window. Closing the Menu under XP's rule would be a
  permanent dead end.
- **The arrival is an animation on `html:not([data-boot])`, not a transition.**
  An animation starts when the element first matches the rule, so it runs when
  the boot screen leaves and, for a returning visitor who gets no boot screen, on
  the first paint. It also hides the moment the script re-lays the row against
  the real viewport. Nothing is hidden by a base `opacity: 0` that a failed
  script would have to undo.

⚠️ **The window colours are NOT measured**, unlike the taskbar's. They are the
public Luna approximation, eyeballed against memory. The component header says
so.

Sections are `#hash` links and the click is not intercepted: the browser sets the
hash and the switcher runs off `hashchange`, which is where the back button and
shareable section links come from. `resolveSection` falls back to Home for a hash
nobody recognises, so a stale link never leaves the pane blank.
```

- [ ] **Step 4: Update the project page**

In `src/content/projects/this-desktop.md`, replace the "Stacked is the base…" paragraph's neighbours as needed and add one decision:

```markdown
**The navigation is the URL, not a click handler.** The Menu entries are plain
anchors to `#section-…`. Nothing intercepts the click: the browser sets the hash
and a `hashchange` listener swaps the pane. The back button and links you can
paste into an email both fall out of that, and there is no history code to get
wrong.
```

- [ ] **Step 5: Full build and test**

Run: `pnpm build`
Expected: `0 errors, 0 warnings, 0 hints`; 23 tests passing.

- [ ] **Step 6: Final browser sweep**

Re-run every check from the spec's §11 table in one session: the row geometry, the stagger on a repeat visit, switching, the deep link, the stale hash, the back button, closing and restoring, stacked at 400px, scripting disabled, reduced motion, and `/404`.

- [ ] **Step 7: Kill the servers and confirm the ports**

```bash
pkill -f "chrome.exe.*9224"; ps aux | grep "astro.mjs preview" | grep -v grep | awk '{print $2}' | xargs -r kill
sleep 2; ss -ltn | grep -E "4321|9224" || echo "puertos libres"
```

- [ ] **Step 8: Commit, push and open the PR**

```bash
git add -A
git commit -m "Documenta la fase 3 en el README y en la ficha del proyecto"
git log -1 --format='%B' | grep -iE "co-authored|claude|generated with" || echo limpio
git push -u origin <branch>
gh pr create --base main --title "Tres ventanas: menú, panel de lectura y contacto" --body "..."
```

- [ ] **Step 9: Verify production**

After the deploy run reports success:

```bash
curl -s https://adc-alt.github.io/ | grep -oE 'id="window-[a-z-]*"|id="section-[a-z-]*"' | sort -u
```

Expected: `window-nav`, `window-main`, `window-contact`, and one `section-…` per section.

---

## Self-review

**Spec coverage.** §1 three windows → Task 5. §3 hashes and no interception →
Tasks 1, 4. §4 sizes, order, titles → Task 5. §4.1 row and the 1204px fallback →
Task 2 (`rowPositions`) and Task 3 (`placeRow`). §4.2 the stagger and the
animation → Tasks 2 and 3. §4.3 the taskbar button surviving a close → Task 3.
§5 the switcher's five steps → Task 4 (`show`). §6 no JavaScript → Task 4 Step 9.
§7 what moves → Tasks 4 and 5. §8 the colophon → Task 5. §9 LinkedIn as one entry
in `SOCIAL` → Task 5 Step 1 comment. §11 verification → Tasks 3, 4, 5 and 6.

**Placeholders.** The only `...` left is the `gh pr create --body`, which is
prose written at the time. Every code step carries its code.

**Type consistency.** `sectionId`, `projectSectionId`, `resolveSection`, `navFor`
and `NAV` are used in Tasks 4 and 5 exactly as Task 1 defines them.
`enterDelay`, `rowPositions`, `ROW_GAP`, `ROW_MARGIN` and `TASKBAR_ENTER_MS` are
used in Tasks 2, 3 and 5 exactly as Task 2 defines them. The `xp:title` event
detail is a plain string in both the dispatcher (Task 4) and the listener
(Task 3). The `x`/`y`/`order`/`row`/`tight` props are declared in Task 3 and
passed in Task 5.

**One gap the plan does not close, on purpose.** Task 3 changes the entrance for
five windows that Task 5 reduces to three, so the stagger is briefly meaningless
(everything defaults to `order = 0`). That is the price of every task ending with
a site that runs.
