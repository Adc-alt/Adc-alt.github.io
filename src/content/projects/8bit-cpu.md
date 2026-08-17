---
title: "An 8-bit computer on breadboards"
summary: "A CPU built out of 74-series logic, one module at a time: clock, registers, ALU, RAM and EEPROM microcode, debugged with an oscilloscope."
year: 2025
stack: ["74LS TTL", "EEPROM microcode", "Breadboards", "Oscilloscope"]
status: "archived"
order: 3
repo: "https://github.com/Adc-alt/8bit-cpu"
---

## The problem

Every program I write runs on a layer I had only read about. I wanted the
layer itself: not a diagram of a CPU, but a machine on the desk where you can
put a probe on the bus and watch an instruction happen.

Ben Eater's series is the reference build, and I followed it — replicating it,
then modifying it, and writing down what broke.

## What it is

The machine module by module: the clock, the registers, the ALU, the RAM, the
program counter, and the control logic held in EEPROMs as microcode. Each module
was wired and tested on its own before joining the bus, because a fault found in
one module is an afternoon and the same fault found in a finished machine is a
week.

## What actually took the time

Not the logic. **The electrical noise.** Pressing a button or switching a RAM
chip throws voltage spikes down the rails, and TTL logic reads a spike as a
signal: the circuit does something that no truth table predicts. RC filtering
and decoupling capacitors on the sensitive modules, and a supply held inside the
range the chips actually want rather than the range they tolerate.

That is the part I would not have learned from a simulator, and it is why this
was built out of components instead of gates in software.

## What I took from it

Reading a bus with an oscilloscope instead of guessing. Microcode as the thing
that turns an opcode into a sequence of control lines, rather than a word in a
book. And the habit of testing a module in isolation before it can lie to you
inside a bigger one — which is the same instinct that later made the robot car's
two chips talk over a documented protocol instead of a tangle of wires.
