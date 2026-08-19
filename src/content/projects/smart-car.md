---
title: "Robot car firmware, rewritten from scratch"
summary: "The vendor firmware of an Elegoo Smart Car V4 thrown away and rewritten: two microcontrollers with a contract between them, and the seeing done off the robot."
year: 2025
stack: ["C++", "ESP32-S3", "ATmega328P", "Python", "OpenCV", "PlatformIO"]
cover: "/media/cover-smart-car.png"
status: "done"
order: 1
repo: "https://github.com/Adc-alt/elegoo-smartcar-firmware-atmega328p"
---

<figure class="clip">
  <video controls preload="none" playsinline width="540" height="960" poster="/media/smart-car.jpg">
    <source src="/media/smart-car.mp4" type="video/mp4" />
    <a href="/media/smart-car.mp4">The clip, as a file (8 MB)</a>
  </video>
  <figcaption>
    A minute and a half of it running: the vision client on the laptop, the car
    finding a green ball on the floor, and the phone driving it from the access
    point the ESP32 serves. Filmed on a phone, which is why it is that shape.
  </figcaption>
</figure>

## The problem

The kit works out of the box, which is exactly what is wrong with it. You get a
car that drives and a firmware you did not write, so the interesting question
never comes up: what should run where, and what happens when a message arrives
half-eaten. I threw the vendor firmware away and rebuilt the system, on the
condition that I could explain every layer of it afterwards.

"From scratch" has quotes around it on purpose. `esp_camera` drives the OV2640,
`IRremote` decodes NEC, `ArduinoJson` serialises, OpenCV decodes the video. What
is mine is everything above that line: the split, the protocol, the loops and
the decisions.

## Three programs on three machines

The car has two microcontrollers, and the third machine is a laptop.

- **[ATmega328P](https://github.com/Adc-alt/elegoo-smartcar-firmware-atmega328p):
  the body.** 16 MHz and 2 KB of RAM. It owns every sensor and every motor and
  it decides nothing. Laughable next to the ESP32, and the right chip for the
  job: with no operating system, no WiFi and no TCP stack stealing cycles, it
  services the ultrasonic sensor on the millisecond it said it would.
- **[ESP32-S3](https://github.com/Adc-alt/elegoo-smartcar-firmware-esp32-s3):
  the glue.** Camera, WiFi, and the decisions. It touches no motor: it asks.
- **[The vision client](https://github.com/Adc-alt/elegoo-smartcar-vision): the
  eyes.** Python and OpenCV on a laptop. A microcontroller cannot look at a
  picture and reason about it, so the looking happens on a real computer and the
  conclusion is posted back as two wheel speeds.

The contract between the two chips is the most important thing in either
repository: JSON over UART, 115200 baud, full duplex, about 200 bytes at 10 Hz.
JSON is bulkier than a binary frame and at 10 Hz there is room to spare; at
100 Hz it would be the first thing to go, and that is written down where the
next person will look.

## Decisions

**Nothing blocks.** The ATmega loop has five phases (boot, listen, obey,
sense, report) and no phase ever waits. Firmware that calls `delay(100)` is firmware
that is deaf for 100 ms. The ultrasonic read uses `pulseIn` with a 25 ms timeout
(about four metres); without that timeout a lost echo blocks forever, which is
the classic way to freeze a robot by pointing its sensor at the sky.

**Reflexes near the hardware, judgement far from it.** The fast dumb layer sits
on the chip that cannot afford to be interrupted; the slow smart layer sits
where there is RAM to spare. It is why the vision runs on a laptop and not on
the car, and it is the same reason the ATmega refuses to make decisions even
though it is the one holding the motors.

**Steering is geometry, not thresholds.** The vision client turns "a green blob
is at pixel (x, y)" into a distance and an angle, and the angle into a turn
radius that becomes two different wheel speeds. The distance model is hand-fitted
with a ruler for one camera at one height, so it is wrong for any other rig,
and says so.

## What it is not

It is not autonomous: close the laptop and the car stops thinking. The honest
list of what is broken lives in each README rather than waiting to be discovered
with a moving robot. Two that matter: the vision client posts to routes the
current firmware does not serve, and the two-second UART watchdog raises a flag
that no code reads yet: **the car does not stop by itself if the link drops.**
