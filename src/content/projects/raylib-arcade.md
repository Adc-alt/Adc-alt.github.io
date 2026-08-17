---
title: "Snake and Tetris in C++"
summary: "Two arcade classics written with raylib while learning C++: the first followed a tutorial, the second did not, and the difference is the point."
year: 2025
stack: ["C++17", "raylib", "Make"]
status: "archived"
order: 5
repo: "https://github.com/Adc-alt/SnakeGameAdc"
---

## What these are

Exercises, and listed as exercises. Snake came out of a YouTube tutorial that I
then pushed past — a life system, a score, a grid background, controls that do
not fight you. [Tetris](https://github.com/Adc-alt/TetrisGameAdc) came a week
later without a tutorial: rotation, line clears, a game-over screen that
restarts.

## Why they are here

Because the week between them is the useful part. The first one taught the
language by transcription; the second taught it by having to decide where the
piece state lives, what a rotation does to it, and which file has a right to
know. Same library, same size, and the second one is organised.

Neither is doing anything clever. What they are is the honest start of writing
C++ that someone else could read — which is what the
[firmware for the robot car](#section-project-smart-car) needed a year later,
in a place where a bad decision costs you a moving vehicle rather than a lost
game.
