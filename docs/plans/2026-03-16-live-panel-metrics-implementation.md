# Live Panel Metrics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the right-side fatigue and cognitive-load panel aligned with the true playback state instead of stale cached display values.

**Architecture:** Preserve precomputed playback for heatmap animation and focus-path timing. Extend focus trace snapshots with persistent/local stress breakdown, then derive the right-panel cognitive load from `evaluatePressureStateAtPoint()` at the current playback position while continuing to read fatigue from the same playback-time snapshot.

**Tech Stack:** Plain JavaScript, existing `src/core.js` simulation runtime, existing `src/app.js` playback UI, Node-based validation in `scripts/validate_scenarios.js`.

---

### Task 1: Lock snapshot stress-state fields

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Assert that precomputed playback snapshots include:
- `persistentStress`
- `ambientNoiseStress`

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the playback snapshots do not yet retain these fields.

**Step 3: Write minimal implementation**

Write these fields into `scenario.focusTraceSnapshots` inside `updateFocusMetrics()`.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for the snapshot-field assertions.

### Task 2: Derive live playback cognitive load in the right panel

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Assert that `getPlaybackFocusInspection()`:
- calls `Sim.evaluatePressureStateAtPoint`
- reuses `snapshot.persistentStress`

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the panel still trusts cached playback pressure values directly.

**Step 3: Write minimal implementation**

In `src/app.js`:
- interpolate the new snapshot stress fields
- build the playback-time point
- re-evaluate pressure at that point with the stored persistent stress
- keep fatigue sourced from the current playback snapshot

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for the live metric assertions and the existing regression suite.
