---
title: "A WiFi cat feeder, and my first PCB"
summary: "A scheduled pet feeder on an ESP8266 — a servo, a level sensor and a board I designed and had manufactured. The first thing I built outside industrial automation."
year: 2025
stack: ["ESP8266", "PlatformIO", "EasyEDA", "3D printing"]
status: "archived"
order: 4
repo: "https://github.com/Adc-alt/esp8266-cat-feeder"
---

## The problem

I come from industrial automation, where the electronics arrive in a DIN-rail
box and you program what is already wired. I wanted the layer underneath: choose
the parts, draw the schematic, route the board, order it, and find out what I
got wrong when it arrives.

A cat feeder is a good excuse. It has to keep time, move a servo at the right
moment, know whether the hopper is empty, and be reachable from a phone — four
small problems with real consequences if the answer is late.

## What is in it

An ESP8266 on WiFi with the feeding schedule, a servo that turns the dispenser, a
level sensor for the food, and a 3D-printed enclosure. The repository carries the
hardware as well as the firmware: schematic, PCB layout, bill of materials and
Gerbers, so the board can be reordered without me.

## What I learned

That the board is the easy half. What costs you is everything that is not on the
schematic: the power supply that behaves differently under a servo's stall
current, the mounting that does not line up with the enclosure, the tolerance you
did not leave. Which is the same lesson as the [8-bit computer](#section-project-8bit-cpu),
learned on a smaller board and a shorter timescale.

It is finished and parked. Its README still carries a placeholder or two from the
template it started as; I would rather leave the project honest about its age
than tidy it up years later and pretend.
