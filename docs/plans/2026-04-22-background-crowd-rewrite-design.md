# Background Crowd Rewrite Design

**Goal**

Rewrite the background-crowd pipeline end to end while preserving the current business rules: OD route weighting, allowed start/end groups, real crowd count targets, platform/elevator queue behavior, and heatmap compatibility.

**Why**

The current implementation has become hard to reason about. The user-visible bugs are no longer isolated:
- ordinary nodes still look like they have waiting queues
- same-route agents keep near-fixed relative spacing and move in a visually unnatural way
- background dots fade with crowd size even though the user wants consistent black dots
- true-count display is not trustworthy enough from the user’s perspective

Incremental fixes have reduced some artifacts, but the remaining issues suggest the background pipeline needs a clean reset rather than more patching.

## Scope

Rewrite these layers:
- background agent spawning and initial distribution
- background route assignment and per-route population balancing
- background lifecycle state machine for `moving / queueing / serving / hidden`
- background field precomputation payload structure
- playback sampling and rendering inputs
- front-end background dot styling and count presentation

Keep unchanged:
- UI layout and information architecture
- heatmap main formula logic
- focus agent behavior
- rules-first basic mode

## Business Rules To Preserve

### Routes and weighting

- Continue using the current OD route pool from `prepared.odRoutes`.
- Continue using the current route-family weight system and balancing logic.
- Continue excluding invalid background routes such as very short routes and prohibited origins.

### Facilities that can visibly queue

Only these facilities may show visible background queues:
- five platform boarding points
- one elevator (`elev_3`)

All other ordinary nodes:
- must never show visible waiting queues
- must never keep background riders lingering near the terminal as a pseudo-queue
- should disappear smoothly on completion and be replaced by the next valid rider

### Service windows

- Platform boarding:
  - train headway 180 seconds
  - one rider boards per second
- Elevator:
  - batch size 13
  - reopen after 40 seconds
  - one rider boards per second

### Population behavior

- When the user sets a crowd value such as 700, 1500, or 3000, the initial field should materialize that crowd level as actual background dots.
- Later active counts may fluctuate around the target because riders finish and respawn, but should stay visually near the requested level.

### Visual behavior

- Background dots must use black, not density-dependent gray.
- Background alpha must not become lighter as crowd count increases.
- Same-route agents should no longer preserve obviously rigid formation.
- Motion variation should be achieved with low-cost per-agent variation, not expensive real-time random pathfinding.

## Proposed Architecture

### 1. Clean background field model

Build a new background field payload centered on stable per-agent records:
- `id`
- `routeId`
- `state`
- `position`
- `active`
- `selectedTargetNodeId`
- timing metadata only where required for playback

Do not keep secondary visual hacks in export:
- no fixed shell repulsion bands
- no display-only fake queue shaping for ordinary nodes

### 2. Explicit lifecycle state machine

Each background rider uses a simple state machine:
- `moving`
- `queueing`
- `serving`
- `hidden`

Rules:
- ordinary terminals: `moving -> hidden -> respawn`
- platform/elevator terminals: `moving -> queueing -> serving -> hidden -> respawn`

This removes ambiguous mixed states like “ordinary node but temporarily looks queued”.

### 3. Spawn distribution rewrite

Replace the current boundary-clamping style initial placement with interval mapping across each route’s valid progress span.

Targets:
- avoid many agents snapping to the same minimum or maximum legal progress
- distribute riders more evenly along route interiors
- maintain safe clearance from start and terminal buffers

### 4. Low-cost motion dispersion

Keep route-based motion, but introduce inexpensive individuality:
- independent speed multiplier per agent
- independent phase offsets
- lateral sway curve
- tangential drift
- occasional route-envelope spreading without changing OD endpoints

This should break rigid formations without creating a major render or compute cost increase.

### 5. Unified playback-to-render contract

The front-end should consume one background playback representation for:
- main workspace map
- Section 04 detail stage

This avoids layer drift and view-specific artifacts.

### 6. Fixed visual style

Background render style should be stable:
- black fill
- stable alpha
- no crowd-size-dependent fading
- true rendered point count equals sampled active background count

## Testing Strategy

Add or update regression coverage for:
- true initial crowd count for several crowd sizes
- no ordinary-node visible queue artifacts at playback export level
- only platform/elevator nodes may enter visible queue states
- initial progress distribution does not collapse multiple riders onto one boundary
- background color style remains black with stable alpha
- main view and Section 04 detail use the same sampled background count

## Risks

- Rewriting the field format may break cached playback assumptions.
- Rewriting lifecycle logic may affect density-field timing if respawn timing changes too much.
- Increasing motion individuality too aggressively may hurt playback smoothness or visual plausibility.

Mitigations:
- bump background field engine version
- keep heatmap formula untouched
- verify with targeted regression scripts before manual page checks

## Success Criteria

- Ordinary nodes no longer look like they have queue lines.
- Only the five platform nodes and one elevator show visible waiting/serving behavior.
- 700 / 1500 / 3000 settings produce visually appropriate dot counts.
- Background dots remain black at all counts.
- Same-route motion no longer looks like rigid synchronized formations.
- Section 04 large heatmap view matches the main playback background behavior.
