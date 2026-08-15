# Spec: boot screen with 100% parity against senna.social

**Date:** 2026-08-14
**Reference:** https://senna.social/ (first page, the boot one)
**Measurement status:** complete. HTML, CSS and JS downloaded and read in full;
render values taken with Chrome DevTools Protocol at 1280x900.

---

## 1. What is wanted

The portfolio's boot screen has to be **the same** as the reference's: same
English text, same layout, same typeface, same colours, same timings, same
animations.

**Three things and only three** change, the ones that identify the owner:

| # | In the reference | Here |
|---|---|---|
| 1 | `Senna's Social Network` | `Adc-alt's Portfolio` |
| 2 | `SENNASOFT Corporation` | `ADCSOFT Corporation` (and the year 2025 → 2026) |
| 3 | The hand-drawn logo (PNG) | Our own hand-drawn doodle (SVG) reading `anthony` |

Consequence of 3: the mark's prefix, `SEN:LAN FUNNY MAN` → `ADC:LAN FUNNY MAN`.

And a fourth out of obligation, not preference: **the icon at the top left** (a
seal with a ribbon, a 42x58 PNG) cannot be copied because it is their drawing. It
is replaced by an equivalent seal drawn in SVG, same slot and same size.

**Everything else is literal**, including the lines that are their own private
jokes (`Micro-D1-NK`, `Dastardly drawings`, `LAN Funny Man [22]`,
`lego-island-two.pcm`). They are the portfolio owner's explicit decision,
repeated four times. They all live in a single config object so changing one is a
one-line edit.

**Nothing in Spanish and no mention of `comecocos` anywhere on the screen.**

> Update of 2026-08-15: item 3 was originally solved with a pixel penguin. It was
> replaced, at the owner's request, by a hand-drawn yellow doodle in the
> reference's own manner — a halo over a cursive signature ending in a face — with
> `anthony` instead of `senna`. Still our own drawing: the only thing taken from
> their PNG is the yellow, `#fdff54`, sampled the way the green already was.

## 2. Attribution

The reference is credited in the `README.md`. The typeface (AcPlus IBM VGA 8x16,
by VileR, CC BY-SA 4.0) is credited in the welcome window, as its licence
requires. **Not one file** from senna.social is copied or served: no images, no
CSS, no JS. The drawings are our own.

---

## 3. Literal content of the reference

Taken from `https://senna.social/` (77 lines of HTML). Each line with its
`data-order`, which is what decides when it appears.

```
order  text
─────  ────────────────────────────────────────────────
  1    Senna's Social Network [Version 95.0.218y2k3]
  4    Copyright (c) 2025 SENNASOFT Corporation.
  2    (icon, 42x58 image, top left)
  3    (logo, 266x168 image, top right)

  5    Loading...

  6    PROCESSOR MODEL :        Micro-D1-NK
  7    Memory Testing:          WHAT?
  8    Dastardly drawings :     [number]  KB
  9      └ the number, which counts up on its own

 10    Keyboard & Mouse     ...
 11    CRT Monitors         ...
 12    LAN Funny Man [22]   ...
 13                                CONNECTED
 14                                PITCHING & WHINING
 15                                ONLINE

 16    CD-ROM inserted :
 17                      lego-island-two.pcm

 18    [PRESS ANY KEY TO CONTINUE]
```

Note that the names of the checks (10-12) appear **before** their verdicts
(13-15). It is not an ornament: it is what makes it look like a machine testing
itself.

### The counter

`textloader.js` runs the number on line 8 up a fixed ladder:

```js
numbers   = [24, 25, 507, 1337, 5678, 9001, 12345, 42069, 80085, 91021]
intervals = [275, 30, 30, 30, 30, 30, 30, 50, 50, 50]
```

Slow at the start (275ms), flat out in the middle (30ms), braking at the end
(50ms). The ten intervals add up to 605ms, but the last one is never actually
waited out (`count()` breaks the loop right after painting the final value,
without scheduling its wait): the ladder runs for **555ms effectively** from the
moment it appears.

> The reference's implementation has a bug: it paints the first value twice (once
> on mount and once in the first `setTimeout`). Since the value is the same, you
> cannot see it. Here it is implemented without the duplicate.

---

## 4. Timings

From `textloader.js`. Milliseconds since `DOMContentLoaded`.

| order | ms | what |
|---|---|---|
| 1 | 1000 | title |
| 4 | 1200 | copyright |
| 5 | 1400 | `Loading...` |
| 2 | 1600 | icon |
| 6 | 1600 | spec 1 |
| 7 | 1700 | spec 2 |
| 3 | 1800 | logo |
| 8 | 1800 | spec 3 (label and unit) |
| 9 | 1900 | spec 3 (the number) → the counter starts |
| 10 | 3000 | name of check 1 |
| 11 | 3050 | name of check 2 |
| 12 | 3100 | name of check 3 |
| 13 | 3200 | verdict 1 |
| 14 | 3250 | verdict 2 |
| 15 | 3700 | verdict 3 ← **450ms extra** |
| 16 | 3800 | `CD-ROM inserted :` |
| 17 | 3900 | the filename |
| 18 | 4000 | the prompt |

Two silences that have to be respected because they are half the character of the
screen:

- **1.1s between 1900 and 3000.** The screen sits still. Without this it is just
  text appearing.
- **450ms extra on the last verdict** (3250 → 3700). As if it were struggling.

**It does not enter by itself.** Verified: after 25s it is still on the boot
screen if you touch nothing.

---

## 5. Render measurements

Taken with CDP on the reference at 1280x900.

| Property | Value |
|---|---|
| Typeface | `AcPlus IBM VGA 8x16` |
| Size | `24px` |
| Line height | `1.3` (= 31.2px) |
| Character width | **9.99px** (advance 0.4167em) |
| Text colour | `#dedede` |
| `body` colour | `#b3b3b3` |
| Background | `#060606` |
| `main` padding | `1%` (+ the `body`'s 8px margin) = 20.6px at 1280 |
| First line | top 20.6 / left 77.6 (the icon takes the first 57px) |
| Icon | 42x58, top left, `margin-right: 15px` |
| Logo | 266x168, `position:absolute; right:0; top:10%` |
| Logo, absolute top (viewport) | **26.86px** |
| Logo, top inside its anchor | **6.23px** (`.boot-container` is `position:relative` and is 62.38px tall; `top:10%` of that gives those 6.23) |
| Green of the logo's strapline | **`rgb(113,246,98)` = `#71f662`** (sampled from the logo PNG, 1452 opaque pixels of that exact value — not picked by eye) |
| Yellow of the logo's drawing | **`rgb(253,255,84)` = `#fdff54`** (same PNG, 4164 opaque pixels; sampled on 2026-08-15 for our own doodle) |
| Prompt | top 556 |
| Document height | 1096 (`#container { height: 1080px }`, `body { overflow-y: hidden }`) |

### The typeface has to be the `AcPlus` variant

`Web437` and `WebPlus` will not do. IBM VGA 8x16 was seen on a 720x400 VGA
stretched onto a 4:3 screen, that is, with pixels taller than they are wide.
`AcPlus` (*aspect-corrected*) bakes that stretch in: the advance is **0.4167em**
instead of 0.5em. With `WebPlus` the letters come out square and wide and the
resemblance breaks however well everything else lines up.

It is already installed at `public/fonts/AcPlus_IBM_VGA_8x16.woff2` (15,556
bytes), taken from int10h's `_win` pack (the `Ac` ones are not in the web pack) by
converting the TTF with `fonttools`.

### The column grid

```css
.aligned-section              { display: flex; flex-wrap: wrap; gap: 20px; }
.aligned-section span         { min-width: 200px; }
.aligned-section span:nth-child(2) { min-width: 40px; text-align: center; }
.aligned-section span:last-child   { text-align: left; }
/* the specs block opens wider: */
<div class="aligned-section" style="gap: 50px">
/* the number and its unit: */
.number { display: inline-block; width: 20px; text-align: right; }
.unit   { display: inline-block; margin-left: -20px; }
```

The positions that come out of that, and which are the proof the copy is right:

| column | x |
|---|---|
| label | **20** |
| a spec's value (gap 50) | **270** |
| the `...` (gap 20) | **240** |
| verdict | **300** |
| unit `KB` | **340** |

> **200px is written as `20ch`.** At 24px a `ch` of this font is 9.99px, so
> `20ch` gives exactly the same 200px — and it also shrinks by itself if a phone
> drops the font size. With fixed pixels it would not. Same treatment for 40px →
> `4ch`, gap 20px → `2ch`, gap 50px → `5ch`, `-20px` → `-2ch`.

### The appearance: there is no fade, there is a jump with a 500ms delay

```css
span { opacity: 0; visibility: hidden;
       transition: opacity 0.5s ease, visibility 0s 0.5s; }
```

This **looks** like a half-second fade and is not. `visibility` has `0s` duration
but **`0.5s` of delay**, so the element stays `hidden` for the whole time the
opacity is rising from 0 to 1. By the time it finally turns `visible`, the
opacity is already 1.

**Result: each line appears all at once, already opaque, 500ms after the time the
table gives.**

Measured on the reference with `requestAnimationFrame` + `getComputedStyle`
(`Loading...`, whose nominal delay is 1400ms):

```
t=1552ms  opacity=0.51    visibility=hidden
t=1730ms  opacity=0.92    visibility=hidden
t=1880ms  opacity=0.9994  visibility=hidden
t=1898ms  opacity=1       visibility=visible   ← visible here, already opaque
```

Almost certainly a bug of theirs and not a decision. It does not matter: you can
see it, so it gets copied. **The two consequences to respect:**

1. **The appearance is abrupt**, not a fade. A real fade shows, and it would be a
   different screen.
2. **The whole sequence ends at 4500ms**, not 4000: everything is shifted by
   500ms. The 1.1s pause and the last verdict's 450ms hold, because the shift is
   the same for everyone.

The CSS is copied as-is instead of adding 500 to every delay: that way the
reference's CSS and ours are the same text, and the comment stops someone
"fixing" it later.

> The counter starts at its **nominal** time (1900), not the visible one (2400),
> because in the reference it comes out of the same `setTimeout` that switches the
> line on. So the counter's first 500ms run hidden and you start seeing it around
> the second or third rung.

### The prompt

It blinks by inverting the video, not with opacity:

```css
.blinking { display: inline-block; animation: blink-effect 1s steps(1, start) infinite; }
@keyframes blink-effect {
  0%   { color: #FFFFFF; background-color: #060606; }
  50%  { color: #060606; background-color: #FFFFFF; }
  100% { color: #FFFFFF; background-color: #060606; }
}
```

### What the reference does NOT have

No scanlines, no vignette, no curvature, no noise. Not a single CRT effect. It is
the first thing that turns a homage into a parody.

---

## 6. Where this departs from the reference, and why

Four things. None of them shows on a desktop.

| Departure | Why |
|---|---|
| It is an **overlay** on the portfolio, not a page that navigates to `home.html` | The whole portfolio has to be in the HTML behind it, or search engines and preview cards index the boot screen instead of the site. A requirement of the original brief. |
| The prompt is a **real `<button>`** | The reference uses a `<span>`: it cannot be tabbed to and a screen reader does not announce it. The text is identical; only the HTML tag changes. |
| **16px below 700px** wide | The reference overflows on a phone. The columns are in `ch`, so the whole grid shrinks and keeps its shape. |
| **A 300ms tube shutdown on exit** | It covers the cut from the overlay to the portfolio. The reference does not need it because it navigates to another page. |

And two requirements from the original brief that the reference does not have and
that are kept here:

- **It only boots at `/` and `/index.html`.** Deep links and `/work/` (the CV
  URL) never see it.
- **`localStorage.boot_seen`**: the second visit does not see it.
- **`prefers-reduced-motion`**: the whole thing appears at once, no fade, no
  counter, no blink and no shutdown.
