# Humanlike Focus Agent Design

**Date:** 2026-04-23

**Goal:** Make the focus agent move like a real elderly traveler instead of a shortest-path robot, while preserving the existing safety constraints and enriching the Section04 thought chain.

## Desired Outcome

The focus agent should no longer:
- hug walls by default
- move as straight line segments between nodes
- snap into hard-angle turns
- rely on a tiny number of coarse route decisions

The focus agent should instead:
- move along smoother, more human-looking curves
- begin turning before corners
- slightly drift, correct, hesitate, and observe
- react to crowd, noise, pressure objects, and spatial openness
- keep producing many small thought-chain entries, not only major route forks

## Core Approach

This feature should use a hybrid control model:

- LLM owns high-level walking intent.
- Rule code owns hard constraints and execution safety.

The LLM should no longer be limited to selecting among a few rule-discovered node decisions. Instead, it should generate:
- route style biases
- avoidance preferences
- intermediate intent anchors
- micro-decision log entries

The runtime should then convert those outputs into legal motion within the existing walkable area and obstacle constraints.

## Control Split

### LLM-controlled

- walking temperament for the whole trip
- preference to avoid walls, crowd, noise, or clutter
- preference to stay central or seek open space
- intermediate intent anchors between origin and destination
- micro-decisions around pressure areas, congestion edges, and ambiguous passages
- thought-chain content for Section04

### Rule-controlled

- do not leave walkable area
- do not pass through walls or obstacles
- maintain collision avoidance
- preserve destination reachability
- preserve queue/elevator/boarding rules
- preserve heatmap formula and burden computation

## Decision Density

The system should stop treating only large branching nodes as valid decisions.

Potential thought / decision triggers should include:
- route forks and candidate-node changes
- pressure object proximity
- crowd-density transitions
- noise-field transitions
- narrow-to-open spatial transitions
- approach to gates, lifts, stairs, escalators, exits, and boarding points
- long corridor posture-adjustment points

This means a route can still produce many thought-chain items even when it is topologically "direct".

## Motion Style

The movement layer should feel elderly and human:

- arc-based turning instead of corner snapping
- anticipation before turning
- soft lateral corrections rather than abrupt lateral jumps
- mild wandering within safe bounds
- dynamic distancing from walls
- stronger reaction when approaching dense crowd or pressure-heavy space
- short hesitation moments near complex or uncomfortable areas

The result should still be stable and replayable from cached analysis output.

## Section04 Thought Chain

The right panel should show a vertical timeline:

- one small circular marker per thought
- a connecting vertical line between markers
- one sentence per item
- ordered from early to late

Each line should be short and concrete, for example:
- "Leaving Exit A, I prefer the wider central zone to avoid brushing the wall."
- "Noise rises near the escalator, so I shift left and slow slightly."
- "The front corridor looks crowded; I keep a bit more distance before passing."

This panel should favor density over abstraction. Minor thoughts are allowed and encouraged.

## Constraints

- Do not change the current UI structure outside the Section04 thought-chain presentation.
- Do not alter the heatmap formula logic.
- Do not break existing rendering stability.
- Keep LLM call count at one call during analysis startup.
- Preserve caching behavior, but include the richer plan payload in cache identity when needed.

## Recommended Direction

The best implementation path is:

1. Expand the LLM output from "decision nodes only" to "human walking intent package".
2. Convert that package into intermediate anchors and richer movement biases.
3. Keep rules as the safety shell.
4. Upgrade Section04 to render dense timeline-style thought entries.

This keeps the system stable enough for the user's final presentation while making the behavior visibly less robotic.
