# Feedback Control: Underwater Robot Depth Tracking

An interactive simulation of proportional (P) feedback control applied to an underwater robot's depth. Based on [HMC E79 Practicum 5](https://sites.google.com/g.hmc.edu/e79-practicum/module-5/practicum-5a).

## The Physics

The robot is modeled as a lumped-element system:

```
m z'' + c z' = F_thrust
```

With proportional control, thrust is proportional to depth error:

```
F_thrust = Kp * (z_desired - z)
```

This gives a second-order closed-loop system:

```
m z'' + c z' + Kp z = Kp z_d
```

With natural frequency and damping ratio:

```
omega_n = sqrt(Kp / m)
zeta = c / (2 * sqrt(m * Kp))
```

## What You'll See

- **Underwater animation** — a robot chases a target depth with thrust arrows and bubbles
- **Step response plot** — position vs. time with a 20% overshoot limit band
- **S-plane pole map** — pole locations move in real time as you change parameters
- **Live metrics** — natural frequency, damping ratio, overshoot, rise time, settling time

## Things to Try

### Understanding the basics
1. **Start with Kp = 2.** Watch the robot slowly settle to the target. Note the damping ratio is high — this is overdamped or heavily damped
2. **Increase Kp to 8-10.** The robot overshoots and oscillates. The poles move away from the real axis on the s-plane
3. **Find the sweet spot.** What Kp gives the fastest response with less than 20% overshoot? (Watch the red shaded band on the plot)

### Exploring parameter relationships
4. **Double the mass.** What happens to the response? Why does increasing mass make the system slower?
5. **Increase drag.** How does this affect damping? Can you make the system critically damped (zeta = 1)?
6. **Change the target depth** while the robot is in motion. How does the controller handle setpoint changes?

### Challenges
- Find the Kp that gives exactly 10% overshoot with the default mass and drag
- Find a mass/drag/Kp combination that is critically damped AND has a rise time under 1 second
- Set Kp very low (0.1-0.3) and observe the steady-state error. Why doesn't the robot reach the target quickly?

### Extend this demo with Claude Code
Try asking Claude Code to:
- **"Add integral control"** — turn this into a PI controller to eliminate steady-state error
- **"Add derivative control"** — add damping without changing the physical drag
- **"Make drag quadratic"** — replace `c*v` with `c*v*|v|` for more realistic fluid dynamics
- **"Add a Bode plot"** — show the frequency response of the closed-loop system
- **"Add noise to the position sensor"** — see how measurement noise affects control performance
- **"Add a second robot"** — compare two different Kp values side by side
