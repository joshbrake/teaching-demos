# Figure Critique: E80 Guidelines

An interactive tool for students to practice reviewing and critiquing scientific figures based on the HMC E80 figure guidelines.

## How It Works

1. The tool starts with a **tutorial** that walks through a well-made figure, highlighting each element (title, axes, plot area, legend, caption, supporting text)
2. After the tutorial, you see canvas-rendered figures with captions and supporting text
3. Hover over the figure to see clickable regions (title, axes, plot area, legend)
4. Click a region and select the matching rubric issue from the popup
5. Use hints if you get stuck
6. Click "Check Answers" to see which issues you found, which you missed, and any false positives
7. Navigate through 6 critique challenges of increasing difficulty

## Rubric Criteria

The rubric covers 11 items across four categories:

- **Axes**: Y-axis label, X-axis label, tick legibility
- **Presentation**: Visual clarity, overcrowding, legend placement
- **Data**: Data trimming, zoom level
- **Text**: Caption format, supporting text quality, title

## Challenge Bank

| # | Title | Difficulty | Issues |
|---|-------|-----------|--------|
| 1 | Well-Made Figure | Tutorial | 0 (walkthrough) |
| 2 | Accelerometer Noise Floor | Easy | 7 |
| 3 | Temperature vs Time | Easy | 3 |
| 4 | Frequency Response | Medium | 5 |
| 5 | Pressure Calibration | Medium | 4 |
| 6 | Motor Step Response | Medium | 3 |
| 7 | Vibration Spectrum | Hard | 5 |

## Adding New Challenges

Add entries to the `CHALLENGES` array in `index.html`. Each challenge needs:

```js
{
  title: 'Challenge Name',
  difficulty: 'easy' | 'medium' | 'hard',
  plotConfig: { /* figure renderer config */ },
  caption: 'Figure N: ...',
  supportingText: '...',
  answerKey: [
    { rubricId: 'x-axis-label', zoneId: 'x-axis', explanation: '...' },
  ],
  hints: ['Hint 1', 'Hint 2'],
}
```

## Architecture

The assessment logic lives in `demos/_shared/assessment-engine.js` — a reusable engine that handles hit zones, annotations, hints, and review mode. This demo provides the figure-specific renderer and challenge content.
