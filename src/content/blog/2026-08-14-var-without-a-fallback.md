---
title: "A var() with no fallback does not fall through to the next value: it invalidates the whole declaration"
date: 2026-08-14
summary: "The bug that cost me the most time on the whole desktop, and it reported an error nowhere."
---

The boot screen picks its typeface like this:

```css
font-family: "AcPlus IBM VGA 8x16", var(--font-mono);
```

The idea is obvious: if the pixel font is not there, fall back to a system
monospace. It worked on the front page and did not work on the desktop, where
the text came out in the browser's default typeface.

The cause is a CSS rule that resembles nothing else in CSS. `--font-mono` was
defined in the global stylesheet, and the desktop does not import it on purpose.
A `var()` pointing at a variable that does not exist **and carrying no fallback
value** does not get skipped: it makes the entire declaration *invalid at
computed-value time*. It does not fall through to the next name in the list. It
throws the whole list away and the property inherits from the parent.

That is unlike almost everything else in CSS, where a value that is not
understood gets dropped and the previous rule stands. Here the rule never comes
into existence.

What makes it expensive is that there is no error anywhere: not in the build, not
in the console, not in the inspector, which shows you the declaration exactly as
written. You only see it by looking at the rendered font and knowing it is not
the one you asked for.

Two ways to stop it happening again:

```css
/* either give the var() a fallback */
font-family: "AcPlus IBM VGA 8x16", var(--font-mono, monospace);

/* or make sure the variable exists where it is used */
:root { --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace; }
```

I picked the second because the desktop is going to end up with its own type
system and I wanted the source of truth in one single place.
