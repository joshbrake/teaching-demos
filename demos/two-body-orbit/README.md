# Two-Body Orbits: Newtonian Gravity

An interactive simulation of two bodies orbiting their common center of mass under Newtonian gravity. Both orbits are elliptical with adjustable parameters.

## The Physics

In the two-body problem, both masses orbit the **barycenter** (center of mass). The relative orbit is an ellipse with semi-major axis `a = a_1 + a_2`, and the individual orbits satisfy:

```
a_1 = a * m_2 / (m_1 + m_2)
a_2 = a * m_1 / (m_1 + m_2)
```

Both orbits share the same eccentricity and period:

```
T = 2pi * sqrt(a^3 / (G * (m_1 + m_2)))
```

Positions are computed by solving **Kepler's equation** `M = E - e sin(E)` at each timestep using Newton's method, then converting eccentric anomaly to Cartesian coordinates.

## Parameters

- **m_1, m_2** — masses of the two bodies
- **a** — total semi-major axis (a_1 + a_2) of the relative orbit
- **e** — eccentricity (0 = circular, approaching 1 = highly elongated)
- **Speed** — animation speed multiplier

## Things to Try

### Explore the basics
1. **Start with default parameters** and watch the orbits. The heavier body (orange) stays closer to the barycenter
2. **Set equal masses** (m_1 = m_2). Both orbits become identical in size
3. **Make one mass very large** (m_1 = 10, m_2 = 0.5). This recovers the "planet orbiting a star" limit
4. **Set eccentricity to 0.** Both orbits become circular

### Observe conservation laws
5. Watch the **total energy** (KE + PE) — it stays constant as the bodies orbit
6. At **periapsis** (closest approach), KE is maximum and PE is minimum
7. At **apoapsis** (farthest separation), the opposite is true

### Explore Kepler's laws
8. **Equal areas in equal times**: The bodies move faster near periapsis and slower near apoapsis. Watch the velocity arrows change length
9. **Kepler's third law**: Increase `a` and watch the period grow as a^(3/2). Double `a` and the period increases by a factor of ~2.8

### Extreme cases
10. Set **e = 0.9** with equal masses. Watch them whip through periapsis together
11. Set **e = 0.95**. The orbits are nearly radial — they almost collide
12. Set **m_1 = 10, m_2 = 0.5, e = 0.0**. This looks like a planet on a circular orbit

### Extend with Claude Code
- **"Add a third body"** — the restricted three-body problem
- **"Show the conserved angular momentum vector"**
- **"Add gravitational wave energy loss"** — watch the orbit shrink over time
- **"Plot the radial velocity curve"** — what an astronomer would see
- **"Add a Hohmann transfer orbit"** — orbital mechanics maneuver
