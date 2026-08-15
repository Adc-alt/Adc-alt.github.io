# XP desktop — phase 1: wallpaper and taskbar

Date: 2026-08-15
Status: approved in conversation, implementation plan pending.

## 1. What gets built

An **inert** desktop that appears after the boot screen: wallpaper and taskbar in
the Windows XP style (Luna theme). Nothing else.

Explicitly **out** of this phase:

- Desktop icons.
- Start menu. The `start` button is drawn and depresses when pressed, but opens
  nothing.
- Windows.
- A design for phones.

## 2. Why this phase exists separately

The end goal, decided by the owner, is for the **XP desktop to replace the
site**: the portfolio will move inside XP windows and the current arcade look
(Press Start 2P, amber, CRT layers, pac-man) will disappear.

This phase builds the shell that will be mounted on. It is not a throwaway
mock-up: `XP.astro` is the definitive layout and the windows will be added inside
it.

## 3. Intellectual property constraint

**No third-party file is copied or served.**

- The Windows XP wallpaper is a photograph with an owner. Ours is **drawn**:
  inline SVG, our own work.
- `winbows.neocities.org` serves its wallpaper as `/resources/bg.jpg` and its
  icons as PNGs. None of that is downloaded or linked.
- From the bar we copy **measurements and colours**, which are facts, not work.
  The CSS is written here from scratch.
- The Windows logo is not used. That was an explicit request from the owner and
  it is also the piece with the heaviest trademark load.

It is the same discipline followed with the boot screen: the layout is traced,
their bytes are not served.

## 4. Measurements of the reference

Taken by sampling two public Windows XP Luna screenshots with Pillow. The
captures were deleted after extracting the numbers; there is no third-party image
in the repository.

### 4.1 Vertical profile of the bar (native resolution)

Sampled on an **empty** column of the bar — no button, no text — from an 800x24
strip. The first column search failed because the "flattest column" criterion
finds the *inside* of a button, not the empty bar; the right criterion is "no
light or dark row", which gave 452 columns.

| Row | Colour | Role |
|---|---|---|
| 1 | `#3e8ce8` | first light edge |
| 3 | `#458ef3` | high band |
| 4 | `#478bf6` | lightest point |
| 5-20 | `#3980f4` | body, practically flat |
| 21 | `#2d64d8` | starts darkening |
| 22 | `#2151c1` | |
| 23 | `#1a43a9` | bottom edge |

The important reading: **the bar is not a smooth top-to-bottom gradient.** It is
a light edge, an almost flat body of sixteen rows, and three rows that darken
abruptly at the end. A two-stop `linear-gradient` looks wrong.

### 4.2 Bar height and Start button

From a 640x480 desktop capture, which is downscaled 2:1:

- Bar: 14-15 rows → **28-30 native px**. Fixed at **30px**, which is XP's default
  at 96 dpi and is consistent with the measurement.
- Start button: 47x14 in the capture → **~94x28 native px**.
- Green of the button: from `#1d861d` (border) to `#259e25` (body).
- Body of the bar in this capture: **`#245edc`**.

### 4.3 The system tray

Sweeping the bar right to left in the same capture:

- The tray starts **~50px from the right edge** → ~100 native px.
- Its left border is a dark line, `#3770a8`, darker than the bar: it is the edge
  that makes it look sunken.
- Its body is **lighter and more cyan than the bar**: `#1290e9`, dropping to
  `#0f6ed1` on the last row.

That the tray is *lighter* than the bar, and not darker, is the thing to copy.
The sunken feel comes from the edge, not the fill.

### 4.4 A discrepancy, and a measuring mistake of mine

The native strip gave a body of `#3980f4` and the desktop capture gives
`#245edc`. Measuring the tray shows where part of the confusion came from: the
**first** column I sampled from the strip was not on the empty bar, it was inside
the tray area, which is a different blue. That first data point was wrong.

Even corrected, the two captures do not agree: they come from different sources.
It is settled like this:

- **The colour comes from the desktop capture**: body `#245edc`. It is the full
  view and it matches the best-documented XP bar blue.
- **The structure comes from the native strip**: light edge at the top, almost
  flat body, and three rows that darken abruptly at the end. It is the only clean
  native profile there is.

During implementation it gets checked with a positive control — render our bar,
sample an empty column and compare the profile row by row. The probe has to fail
against a badly painted bar, not just pass ours.

### 4.5 What the winbows bar looks like, and why it is not copied

The reference the owner gave is a flat simplification: 35px, plain `#0055EA` blue
with a single lighter inner line, and a Start button that is a 100px green
rectangle in bold italic Tahoma. It has no gradient and no rounded corner.

Asked, the owner chose **the real XP bar**. The winbows bar is documented here
only to record that the deviation from "as it stands" is deliberate and was
checked.

## 5. Architecture

### 5.1 Routes

| Route | Before | After this phase |
|---|---|---|
| `/` | arcade front page with boot screen | **unchanged** |
| `/xp/` | does not exist | desktop, `noindex`, out of the sitemap |

`/` is not touched in this phase. A desktop with no windows is a dead end, and
the portfolio is the owner's job-hunting tool: between this phase and the next,
the root has to keep leading somewhere. The root becomes the desktop the day the
windows exist.

`/xp/` carries `noindex` for the same reason as `/work/`: it is
work-in-progress content and must not compete in Google with the real site.

### 5.2 Files

| File | What it is |
|---|---|
| `src/layouts/XP.astro` | New layout. `<head>`, the wallpaper and the bar. **Definitive**, not scaffolding. |
| `src/components/xp/Taskbar.astro` | The bar: `start`, window area (empty), tray. |
| `src/components/xp/Wallpaper.astro` | The wallpaper SVG. |
| `src/components/xp/clock.mjs` | Time formatting. A module of its own so it can be tested. |
| `src/components/xp/clock.test.mjs` | Its test. |
| `src/pages/xp.astro` | The page. Uses `XP.astro` and reuses `Boot.astro`. |

`XP.astro` does **not** import `global.css` or the arcade fonts. The desktop has
its own system and must not drag the old site's along.

The `src/components/xp/` folder exists so phase 2 has somewhere to put the window
manager without cluttering `src/components/`.

## 6. The wallpaper

Inline SVG inside `Wallpaper.astro`: a sky gradient top to bottom, a hill as a
`path`, and clouds. Our own work, evoking the landscape without copying the
photograph.

- **Inline, not as a file.** No HTTP request and no initial flash.
- `preserveAspectRatio="xMidYMid slice"` so it fills any aspect ratio the way a
  wallpaper does, cropping instead of distorting.
- A solid fallback colour on the `<body>` underneath, in case the SVG fails.
- `aria-hidden="true"`. It is decoration.

## 7. The bar

Three zones in a row, just like XP:

```
[ start ] [ open windows — empty in phase 1 ] [ tray: clock ]
```

- **30px** tall, fixed to the bottom, full width.
- Background: body `#245edc` (§4.2) with the structure of §4.1 — light edge at
  the top, an almost flat body over most of the height, and three pixels that
  darken abruptly at the end. A `linear-gradient` with percentage stops, not one
  of two colours.
- `start` button: **94x28**, green `#1d861d`→`#259e25`, white text in Tahoma with
  a shadow. On press it depresses: it does nothing else.
- Tray: **100px** wide, body `#1290e9` — *lighter* than the bar — with the dark
  left edge `#3770a8` that is what sinks it. The clock inside.
- The window area is left empty and is **not drawn** in phase 1.

**The button's corner radius is not measured.** At 1:2 scale the corner pixels
blend into the blue and the green-detecting criterion discards them, so the
measurement it produces (2-4px) underestimates the real rounding. It is fixed at
**8px on the two right corners only** as a starting value and adjusted by looking
at a native capture during implementation. It is the only number in this spec
that does not come from a clean measurement, and it is flagged on purpose: in the
boot screen work, the one colour set by eye was exactly the one review knocked
down.

## 8. The entrance

Chained to the boot screen, which already exists and is not touched:

1. The boot screen shuts off with its CRT wipe (300ms, already implemented).
2. The wallpaper appears.
3. **400ms later**, the bar slides up from the bottom.

The offset in step 3 is the detail that sells the scene: if the bar appears at the
same time as the wallpaper, it looks like an image; if it rises afterwards, it
looks like a machine starting up.

All of it behind `prefers-reduced-motion`: with the preference set, wallpaper and
bar appear already in place, with no slide.

## 9. The clock

- The browser's real time, `HH:MM` format in 24h.
- Updated on the minute change, not every second.
- **It is the only logic in the phase**, and that is why it is the only thing with
  a test: `clock.mjs` exports a pure `formatTime(date)` and `clock.test.mjs` pins
  it with `node:test`. The rest of the phase is CSS and gets checked by looking
  at it.

With JavaScript disabled the tray stays empty, and that is acceptable: it is
decoration, not content.

## 10. Accessibility

- The wallpaper and the bar's ornaments carry `aria-hidden`.
- `start` is a real `<button>`, focusable, with a visible focus ring.
- The clock goes in a `<time>` with `datetime`, so a screen reader gets it exactly
  and does not depend on contrast.

### 10.1 The XP colours do not reach AA, and that has to be decided

Contrast computed on the measured colours, not estimated:

| Text | On | Ratio | AA normal (4.5:1) | AA large (3:1) |
|---|---|---|---|---|
| white | green `#259e25` | **3.50:1** | ✗ | ✓ |
| white | tray `#1290e9` | **3.39:1** | ✗ | ✓ |

It is not a defect of the implementation: the 2001 interface was designed before
this was measured this way. For white to pass AA, both luminances would have to
come down by about 30%, and at that point it is neither XP's blue nor XP's green.

**Recommendation: keep the XP colours and leave it documented.** It is a homage to
one particular interface, the clock's information arrives intact through the
`<time datetime>`, and both colours do meet AA for large text.

**This is the owner's decision, not mine.** It is recorded here because it
degrades accessibility against the current site, which does comply. If he prefers
to comply, both colours get darkened to luminance ≤ 0.1833 and the resemblance is
lost; the spec does not choose for him.

## 11. Verification

| What | How |
|---|---|
| Time format | `clock.test.mjs`, with `node --test` |
| Bar profile | Render, sample the empty column, compare row by row with §4.1 |
| Height and button | Measure in the browser: 30px and ~94x28 |
| Contrast | Compute on the final colours, do not estimate |
| No third-party files | `git diff` adds no image; `grep` finds neither `neocities` nor `bg.jpg` |
| Reduced motion | With the preference set there is no slide |
| The site is still alive | `/` and `/work/` render as before |

The profile check needs a **positive control**: it has to be verified that the
method detects a badly painted bar, not just that it passes ours.

## 12. Deliberate deviations from the reference

| Deviation | Why |
|---|---|
| Real Luna instead of the flat winbows bar | Owner's choice, asked expressly |
| `start` in English, not "inicio" | Owner's choice; consistent with the boot screen, which is already in English |
| No logo | Explicit request from the owner |
| Drawn wallpaper, not a photograph | §3 |
| Lives at `/xp/`, not at `/` | §5.1 |

## 13. Out of scope — phase 2

Noted so the design above does not block it, not to be done now:

- XP windows with the portfolio content inside.
- **The windows are rendered at build time as ordinary HTML**, and the JavaScript
  only drags, minimises and closes them. Already decided, and it has to be decided
  now: if JavaScript generated the content, a search engine would see an empty
  desktop, and redoing it later would mean rewriting the windows entirely.
- Desktop icons and Start menu.
- Window buttons in the bar.
- A design for phones, deferred by the owner.
- Moving the desktop to `/` and retiring the arcade look.
