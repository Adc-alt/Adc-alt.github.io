---
title: "The site is turning into a Windows XP"
date: 2026-08-15
summary: "This window was the first piece. The plan was for the whole portfolio to end up living inside the desktop, and by the end of the day it did."
---

What you are reading is a real window: it drags by the title bar, minimises to
the taskbar and closes. The content is not painted by JavaScript, it is in the
HTML from build time; the JavaScript only moves the window. Turn it off and the
window is still here and reads the same. It just stops moving.

The wallpaper is Bliss, the real one. The taskbar is not: that one is drawn in
CSS from colours measured off screenshots, pixel by pixel. It has three details
that look like trivia and are exactly what makes it recognisable:

- The blue of the bar **is not a gradient**. It is a six-pixel light edge, a flat
  body, and three pixels that darken abruptly at the end.
- The clock tray is **lighter** than the bar, not darker. What makes it look
  sunken is a one-pixel dark edge on its left.
- The rounding of the Start button is not circular: it moves four pixels
  horizontally and takes ten rows to do it.

The plan was for this to replace the site, and it did, the same day. The
portfolio now lives in windows like this one and the arcade look is gone. It
spent a few hours at `/xp/` while it was being built, because a desktop with no
windows was a dead end; that address now redirects to the desktop itself.
