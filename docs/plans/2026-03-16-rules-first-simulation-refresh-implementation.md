# Rules-First Simulation Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the prototype’s runtime so fatigue, cognitive load, background crowd generation, heatmap persistence, and trace inspection follow the approved rules and remain performant at peak-scale crowd counts.

**Architecture:** Keep the app as a pure frontend SPA. Move rule-heavy calculations into `src/core.js`, keep SVG for precision interactions, introduce a Canvas-first background crowd renderer with a retained SVG fallback path, and update the app shell to expose absolute fatigue/cognitive-load values and the new review workflow. Use `scripts/validate_scenarios.js` as the primary executable specification and extend it before each implementation batch.

**Tech Stack:** Plain HTML, CSS, vanilla JavaScript, existing `src/core.js` simulation engine, HTML Canvas, SVG overlay, Node-based validation script.

---

### Task 1: Lock the revised rules-first contract in validation

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Inspect: `src/app.js`
- Inspect: `src/core.js`
- Inspect: `styles.css`

**Step 1: Write the failing test**

Add validator assertions for:
- absolute fatigue and cognitive-load display hooks
- peak-only slider labeling behavior
- background crowd immediate generation hooks
- trace-point inspection hooks
- retained SVG fallback / Canvas background renderer hooks
- first-pass-only heatmap persistence hooks
- thinner node stroke and black focus agent color hooks

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current implementation still uses simplified percent-like metrics and does not expose the new runtime hooks.

**Step 3: Write minimal implementation**

Only update the validator to reflect the approved target behavior. Do not change production code yet.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL against the current runtime implementation, not because of validator syntax.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 2: Replace simplified fatigue with rule-table absolute values

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- fatigue starts at `0`
- fatigue thresholds match the approved age table
- fatigue no longer clamps to `0..100`
- right-panel fatigue display is numeric and threshold-aware

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because fatigue is still treated like a bounded percentage-style score.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- absolute fatigue state
- age-band threshold lookup
- walking fatigue accumulation using base velocity
- helper functions for crowd, noise, lighting, and queue fatigue coefficients

Implement in `src/app.js`:
- numeric fatigue display
- red threshold styling hook when fatigue exceeds the threshold

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for fatigue assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 3: Replace simplified stress with rule-based cognitive load

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- cognitive load starts at `0`
- service/signage/advertisement encounter rules exist
- positive and negative stress deltas use different environmental coefficient columns
- heatmap value uses the same scalar as displayed cognitive load

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because cognitive load still uses the previous simplified heat/scalar pipeline.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- encounter tracking per focus agent
- rule-table stress deltas and probabilities
- crowd/noise coefficients for positive vs negative deltas
- absolute cognitive-load accumulation

Implement in `src/app.js`:
- rename / display right-panel metric as cognitive load
- numeric formatting instead of percent formatting

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for cognitive-load assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 4: Add environment-field evaluation from rules

**Files:**
- Modify: `src/core.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- vision radius remains `15m`
- queue radius remains `3m`
- environment noise includes `60 dB` base noise plus source contributions
- environment lighting includes `250 lux` base lighting plus source contributions
- signage/advertisement effects require vision-range entry

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current environmental evaluation is still approximate.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- explicit noise field evaluation
- explicit lighting field evaluation
- queue population helper
- density calculation inside vision range
- documented decay assumptions for noise/light sources

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for environment assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 5: Harden path planning and wall clearance

**Files:**
- Modify: `src/core.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- moving agents maintain approximately `>=2m` wall clearance where possible
- facility endpoints remain reachable
- focus agent no longer prefers hugging the wall on generic walk segments

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current pathing still permits visibly wall-hugging movement.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- stricter wall-clearance filtering for projected walkable cells
- stronger near-wall penalties in route choice
- local correction logic that preserves endpoint reachability

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for wall-clearance assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 6: Rebuild peak-scale background crowd generation

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- slider still ranges `100..3190`
- visible labels emphasize peak `3190` and remove the old midpoint mark
- changing the slider immediately rebuilds background crowd positions
- background agents are distributed across OD families rather than spawned only at endpoints

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current crowd setup does not immediately populate the floor with the requested distribution.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- route-weight-based background crowd generation
- randomized progress placement along paths
- retained crowd seed for repeatable first-pass conditions

Implement in `src/app.js`:
- immediate floor regeneration when the slider changes
- updated slider labeling / peak annotation

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for background crowd assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 7: Introduce Canvas-first background rendering with SVG fallback

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- dedicated background crowd canvas exists
- SVG fallback renderer hooks still exist in code
- focus agent remains on the SVG overlay
- node hit areas remain clickable after renderer split

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because background agents are not yet separated into a Canvas-first renderer.

**Step 3: Write minimal implementation**

Implement in `index.html`:
- background crowd canvas layer positioned beneath the SVG overlay

Implement in `src/app.js`:
- Canvas batch drawing for background crowd dots
- retained SVG fallback code path behind a local renderer mode switch
- focus-agent-only SVG rendering retained for interaction

Implement in `styles.css`:
- canvas layer styling
- thinner node stroke
- focus and background dot color updates

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for renderer assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 8: Fix first-pass heatmap deposition and rainbow palette

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Modify: `styles.css`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- heatmap starts blank before the focus agent moves
- no warmup pre-coloring remains
- deposited heat only appears along traversed positions
- palette spans low-purple to high-red

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current heatmap still relies on warmup and the old color ramp.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- first-pass-only heat deposition
- removal of the old warmup-based prefill behavior
- frozen heatmap state after pass completion

Implement in `src/app.js`:
- rainbow heat palette mapping
- render the frozen first-pass heatmap without mutation during loop playback

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for heatmap assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 9: Add first-pass trace review and point inspection

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Modify: `styles.css`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- focus trace is stored as sampled snapshots
- a dashed trace path is rendered after the first pass
- only trace samples are clickable for review
- clicking a trace sample exposes stored fatigue / cognitive-load / environment values

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because trace review and snapshot inspection do not yet exist.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- store snapshot samples along the first-pass trace

Implement in `src/app.js`:
- dashed trace rendering
- sample hit areas
- trace-point inspection workflow
- disable arbitrary floor inspection for this review mode

Implement in `styles.css`:
- dashed trace styling
- trace sample hit-area styling

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for trace review assertions and still FAIL for later tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 10: Freeze first-pass results while allowing visual looping

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- after first-pass completion, agents reset to the initial distribution
- the retained heatmap does not continue changing during loop playback
- the retained trace does not mutate during loop playback
- changing route, crowd, or edited pressure values invalidates the frozen pass and triggers recomputation

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current loop behavior is not separated from the computed first pass.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- explicit first-pass completion state
- retained snapshot state
- loop playback reset state

Implement in `src/app.js`:
- replay loop that reuses the initial placements
- invalidation on input change

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for first-pass freeze assertions and still FAIL for later tasks if any remain.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 11: Final verification

**Files:**
- Modify: none

**Step 1: Run JS syntax checks**

Run: `node --check src/app.js`

Expected: PASS

**Step 2: Run core syntax checks**

Run: `node --check src/core.js`

Expected: PASS

**Step 3: Run Rhino export validation**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: PASS

**Step 4: Run scenario validation**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Document deferred work**

Document that 3D, LLM integration, and persistence/export of edited runtime overrides remain deferred.

