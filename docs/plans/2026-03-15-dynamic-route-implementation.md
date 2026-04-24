# Dynamic Route & Pressure Editing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace fixed focus-route presets with region-based dynamic route selection, support node classification display and region picking in the UI, and add session-scoped pressure-point parameter editing that affects subsequent simulations.

**Architecture:** Keep Rhino export as the source of geometry and node/pressure inputs, but move route selection from static presets to runtime-generated endpoint groups and decision-node replanning. Use a mixed rendering strategy: keep interactive overlays in SVG while migrating high-volume background agents to canvas so the app can scale toward the new crowd slider range.

**Tech Stack:** Plain HTML/CSS/JS frontend, `src/core.js` simulation engine, `src/app.js` UI/orchestration, existing Node/Python validators

---

### Task 1: Lock the revised rules in validation

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Modify: `src/core.js:32-70`

**Step 1: Write the failing test**

Add assertions for:
- `VISION_RADIUS = 15`
- no dependency on `FOCUS_ROUTE_PRESETS` for the focus-agent flow
- crowd control accepts a numeric range rather than only `normal/peak`
- node groups include the new `train_door_1..5` naming and exit groups A/B/C/D

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current code still uses fixed presets and `VISION_RADIUS = 12`.

**Step 3: Write minimal implementation**

Only update the validator to reflect the approved target behavior. Do not touch production logic yet.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL against old runtime logic.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 2: Replace fixed focus-route presets with runtime region goals

**Files:**
- Modify: `src/core.js`

**Step 1: Write the failing test**

Add a focused scenario-validation assertion that:
- a scenario can be created from `{ startPoint, targetRegionId }`
- endpoint collections are built from node names rather than a hard-coded three-route preset list

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because `createScenario` still expects `focusRouteId`.

**Step 3: Write minimal implementation**

Implement:
- node name parser and region classifier
- region collections for A/B/C/D exits, `cw_train`, `twl`, `kdt`
- scenario creation from arbitrary start point plus region goal
- removal/replacement of fixed focus-route preset dependency for the focus agent

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for the new focus-agent scenario shape.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 3: Add decision-node replanning and queue-lock rules

**Files:**
- Modify: `src/core.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Add assertions that:
- focus agent evaluates route choice at nodes only
- facility switching applies only before entering the `3m` queue zone
- `>15` queue size uses `87.5%` switching probability
- once inside queue radius, the chosen facility remains locked

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current agents follow precomputed paths.

**Step 3: Write minimal implementation**

Implement:
- decision-node detection
- candidate-facility evaluation using walk/wait/ride cost
- switch probability table
- queue-lock state
- facility-only replanning scope

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 4: Add route-picking UI for start point and target region

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Add validator checks for:
- route selection mode controls
- target-region controls
- node classification labels/colors
- removal of the fixed route dropdown dependency

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current UI still expects `focus-route-select`.

**Step 3: Write minimal implementation**

Implement:
- “选择路线” mode
- first click = start point
- second click = target region
- node overlay with category colors and Chinese labels
- scenario payload creation from the new selection state

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 5: Replace crowd preset buttons with a numeric slider

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Add assertions for:
- crowd slider presence
- minimum `100`
- labeled marks at `1595` and `3190`
- scenario creation accepts arbitrary crowd counts in range

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the app still uses `normal/peak`.

**Step 3: Write minimal implementation**

Implement:
- slider UI and state binding
- scenario generation from numeric crowd count
- removal or adaptation of old preset-only assumptions

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 6: Add pressure-layer filtering and session-scoped editing

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Add assertions for:
- category-level pressure layer toggles
- editable inspector fields for `noise`, `advert`, `signage`
- `facility` remains view-only
- rerunning simulation after edits uses the updated in-memory parameters

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because pressure points are currently read-only.

**Step 3: Write minimal implementation**

Implement:
- per-category visibility toggles
- right-panel form controls per category
- transient edited-pressure state in app memory
- rebuild prepared pressure data before rerunning simulation

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 7: Migrate background agents to canvas-backed rendering

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Add a lightweight validator check for:
- dedicated background-agent canvas layer
- SVG overlay reserved for interactive items

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because all agents are currently drawn in SVG.

**Step 3: Write minimal implementation**

Implement:
- canvas layer for background agents
- reuse current transform chain for canvas/SVG alignment
- keep focus agent, nodes, seats, hotspots, and hit areas in SVG

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 8: Final verification

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

Note any remaining naming or balancing tasks not covered by this implementation.
