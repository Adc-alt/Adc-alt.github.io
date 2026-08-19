---
title: "Forty-three scripts learning to see"
summary: "Two months of 2023 spent teaching myself computer vision the slow way: one numbered Python script per idea, from a face in a box to gestures that switch on real LEDs."
year: 2023
stack: ["Python", "OpenCV", "MediaPipe", "YOLOv5", "face_recognition", "Arduino"]
status: "archived"
order: 5
---

<figure class="clip wide">
  <video controls preload="none" playsinline width="1352" height="720" poster="/media/computer-vision.jpg">
    <source src="/media/computer-vision.mp4" type="video/mp4" />
    <a href="/media/computer-vision.mp4">The clip, as a file (6 MB)</a>
  </video>
  <figcaption>
    Seventy-five seconds of the folder running: a face in a red box, curls
    counted off the angle of an arm, an HSV mask with the trackbars that tuned
    it, four faces named off a photograph, a cup and a person labelled with
    their confidences, a gesture lighting an LED on a breadboard, and a heart
    drawn in the air with a fingertip.
  </figcaption>
</figure>

## Where it started

In 2023 I could write Python and had never made a computer look at anything. So
I gave myself a folder, `COMPUTERVISION`, and a rule: one file per idea, numbered
in the order I learned it, and nothing deleted. The last one is `openCV-43.py`.

The rule is the whole point. A tutorial project ends up as one file that does
everything and explains nothing, and when it breaks there is no earlier version
to compare it against. Forty-three files is a diff of my own understanding: what
`openCV-17.py` does with six trackbars, `openCV-38.py` does with a function.

## What is in there

- **Faces, twice.** First a Haar cascade — fast, dumb, a rectangle. Then
  `face_recognition`, which turns a face into 128 numbers and compares them, so
  a photograph comes back with four boxes and two names on it, and *Unknown
  Person* on the two it has never been shown.
- **Colour is not a colour.** Tracking a yellow post-it taught me why nobody
  segments in RGB: eight trackbars over hue, saturation and value, moved by hand
  until the mask stops flickering, and moved again when the sun comes round.
- **Hands as input.** MediaPipe gives twenty-one landmarks per hand; the
  interesting part is what you do with the indices. Fingertips against knuckles
  counts fingers. A sequence of those counts is a gesture. A gesture on a serial
  port is an LED on a breadboard, and a fingertip tracked across frames is a pen.
- **A repetition is a state machine.** `main_gym.py` counts bicep curls off the
  angle at the elbow, and the counting is the part that is not obvious: an angle
  crossing a threshold fires every frame it stays there. What counts a rep is a
  variable that remembers whether the arm was up or down and only increments on
  the change.
- **Somebody else's model.** YOLOv5 puts *person 0.55* and *cup 0.87* on the
  webcam, and the number after the label is the whole lesson: a detector does
  not tell you what is there, it tells you how sure it is, and 0.55 on a cup you
  are holding in front of the lens is a threshold you now have to choose.

## What it turned into

Nothing shipped, and that was the deal. What it turned into is the vision half
of [the robot car](#section-project-smart-car) two years later — the same
`VideoCapture` loop, the same habit of asking what the camera actually resolves
before trusting the number it produces.

## What it is not

It is not a repository. Forty-three scripts called `openCV-NN.py`, half of them
with a hard-coded path to a photograph on a laptop I no longer own, are notes
rather than software, and publishing notes as a project would be dressing up.
The video is the honest artefact: it is what the folder does when you run it.
