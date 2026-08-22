---
title: "A quadcopter, built in the order that de-risks it"
summary: "Phase zero of five: fly it in simulation and learn the control loop, before buying a motor, before writing the loop myself, before designing the board that runs it."
year: 2026
stack: ["PX4", "Gazebo SITL", "QGroundControl", "MAVLink", "C++", "WSL"]
status: "wip"
order: 0
---

## The problem

Buying a flight controller and bolting it to a frame gets you a drone that
flies. It does not get you a person who knows why it flies, and the moment it
stops flying you are reading someone else's tuning guide with no idea which
number to touch.

So the order is deliberate, and the cheap end comes first. Five phases, and the
one I am in costs nothing:

- **0. Simulation.** Fly it in a simulator and learn the control loop, before
  buying a single screw.
- **1. A bought controller.** The real airframe in the air on a Pixhawk clone,
  which de-risks the frame with hardware that is already known to work.
- **2. My loop.** Attitude estimation and the PID implemented by me, so there is
  something to compare PX4's against on the same airframe.
- **3. My board.** Design, fabricate and solder the flight controller, and fly
  the same airframe on it.
- **4. A pointable payload.** A gimbal and vision that hold a target while the
  aircraft moves under them.

Phase 3 is the point of the whole thing. Everything before it exists so that
when my own board does not fly, I already know the airframe does.

## Where it is now

Phase 0, most of the way through. PX4 built from source and running as software
in the loop, a simulated airframe in Gazebo, QGroundControl as the ground
station, and a list of things I have to be able to do before I call the phase
finished: fly a waypoint mission and land it, explain what each flight mode
stabilises and which sensor it needs, and draw the loop from sensors through
attitude estimation and the PID to the motor mix.

## The first real lesson came from a refusal

The first time I asked the simulated aircraft to take off, it would not arm.
The log said `Preflight Fail: No connection to the GCS`, and my assumption was
that I had installed something wrong.

I had not. PX4 will not arm without a ground control station connected, and it
is right to refuse: an aircraft nobody can talk to is an aircraft nobody can
tell to come down. I started QGroundControl, the same command took off, and the
lesson was worth more than the takeoff. The failure was a safety interlock doing
its job, and I had been about to go looking for a bug in it.

The second one was quieter and cost longer. Altitude read as `z = -2.40` and I
went looking for a sign error. PX4 reports position in NED, north east **down**,
so a negative z is height above the ground. It looks like a bug and it is a
convention.

## What it is not

Nothing has flown. There is no airframe, no motor, no board: everything so far
is a real firmware compiled for a laptop, flying an aircraft that does not
exist. That is the point of phase 0, and it is also the honest limit of what
this project can currently claim.
