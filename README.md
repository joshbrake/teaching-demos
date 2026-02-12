# Teaching Demos

A collection of interactive browser-based demos for teaching engineering and science concepts. Each demo is a self-contained HTML file you can open directly in a browser — no installation required.

An optional Flask app lets you serve all demos from one place with a landing page.

## Demos

| Demo | Topic | Description |
|------|-------|-------------|
| [Feedback Control](demos/feedback-control/) | Controls | Proportional depth control of an underwater robot. Explore how gain affects overshoot, damping, and rise time. Based on HMC E79 Practicum 5. |
| [Two-Body Orbits](demos/two-body-orbit/) | Mechanics | Two masses orbiting their barycenter under Newtonian gravity. Adjust masses, semi-major axis, and eccentricity. |
| [Figure Critique](demos/figure-critique/) | Scientific Writing | Identify issues in scientific figures using the HMC E80 rubric. Click problem areas, classify issues, check answers. |

## Quick Start

### Option 1: Just open the HTML files

Each demo lives in `demos/<name>/index.html`. Open any `index.html` directly in your browser — no server needed.

### Option 2: Run the Flask app

```bash
pip install flask
python app.py
```

Then visit `http://localhost:5000` to see all demos.

## Things to Try

These demos were designed to be explored and modified with an AI coding assistant like Claude Code. Here are some ideas:

### Explore the existing demos
- **Adjust parameters** using the sliders and observe how the system responds
- **Try to find optimal values** — e.g., the highest gain that keeps overshoot under 20%
- **Look at the code** — each demo is a single HTML file with embedded JavaScript. Read it to understand the math and physics

### Modify and extend with Claude Code
- Ask Claude Code to **add PID control** (integral and derivative terms) to the feedback controller
- Ask it to **change the plant model** — what if drag is quadratic instead of linear?
- Ask it to **add a new plot** — e.g., a Bode plot or a phase portrait
- Ask it to **create an entirely new demo** — pick any concept from your course and describe what you want to visualize

### Create your own demo
1. Pick a concept (e.g., beam deflection, RC circuits, Fourier series, projectile motion)
2. Describe what you want to Claude Code: the physics, what should be interactive, what plots to show
3. Watch it build a working demo in minutes
4. Iterate — ask for changes, new features, different visualizations

### Share with students
- Fork this repo and add your own demos
- Students can modify the demos as homework exercises
- Use the demos during lecture for live exploration

## Structure

```
teaching-demos/
  README.md              # This file
  app.py                 # Optional Flask app to serve all demos
  demos/
    feedback-control/
      index.html         # Self-contained demo
      README.md          # What this demo covers and things to try
    ...                  # More demos here
```

## Contributing

Add a new demo by creating a folder under `demos/` with an `index.html` and a `README.md`. Keep demos self-contained (no external dependencies) so they work offline.
