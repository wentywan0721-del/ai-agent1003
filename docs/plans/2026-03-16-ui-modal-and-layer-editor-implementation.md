# UI Modal And Layer Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the current 2D frontend shell with localized title/file-name behavior, guided route and agent modals, a background-crowd slider, 10 category layer buttons, and session-scoped point editing that changes later heatmap results.

**Architecture:** Keep the app as a plain HTML/CSS/JS single-page prototype. Implement new UI workflows in `src/app.js`, add modal and display structure in `index.html`, restyle and encode the new visual language in `styles.css`, and only touch `src/core.js` where edited in-memory pressure/crowd inputs must flow back into scenario creation.

**Tech Stack:** Plain HTML, CSS, vanilla JavaScript, existing `src/core.js` simulation engine, existing `scripts/validate_scenarios.js`, existing Node/Python validation commands.

---

### Task 1: Lock the new UI contract in validation

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Inspect: `index.html`
- Inspect: `styles.css`
- Inspect: `src/app.js`

**Step 1: Write the failing test**

Add validator assertions for:
- localized product title hook and editable `untitled` affordance
- route modal DOM nodes
- agent modal DOM nodes
- background crowd slider DOM nodes
- 10 category layer buttons
- point-popover edit container hooks
- updated node / floor / agent style hooks

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current UI does not yet expose the modal, slider, 10-button, and editable-name structure.

**Step 3: Write minimal implementation**

Only update the validator so it reflects the approved target behavior. Do not change production code yet.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL against runtime/UI implementation, not because of validator syntax.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 2: Add localized title and editable file-name behavior

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- editable file-name element exists
- app title is rendered through locale-aware text update logic
- file-name edit controls / state hooks exist in `src/app.js`

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because title/file-name editing is not implemented.

**Step 3: Write minimal implementation**

Implement:
- localized English product title
- inline `untitled` edit mode
- save on blur / Enter
- cancel on Escape
- minimal style states for display vs edit mode

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for title/file-name assertions and still FAIL for later unimplemented tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 3: Replace direct route picking with a guided route modal

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Reuse: `src/core.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- route modal DOM structure exists
- route instruction text node exists
- confirm / clear buttons exist
- route modal map container exists
- `src/app.js` includes dedicated modal state and confirm/clear handlers

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current route flow still uses direct interaction instead of modal orchestration.

**Step 3: Write minimal implementation**

Implement:
- route modal shell in `index.html`
- open / close / confirm / clear state in `src/app.js`
- first-step start-node selection in modal map
- second-step target-region selection in left-side region list
- selected start node enlarge/highlight behavior
- writing confirmed selection back into existing route state
- main viewport rendering only selected start and target after modal closes

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for route-modal assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 4: Add the agent setup modal with silhouette preview

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- agent modal DOM nodes exist
- age / gender / BMI category inputs exist in modal
- preview container exists
- confirm / clear buttons exist
- `src/app.js` includes preview-state logic

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the agent modal and preview behavior do not exist yet.

**Step 3: Write minimal implementation**

Implement:
- modal structure and open/close logic
- modal-local form state
- silhouette rendering using SVG or styled DOM
- posture changes by age band
- silhouette base changes by gender
- width changes by BMI category
- slow rotation animation
- confirm / clear behavior that syncs back to current focus-agent settings

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for agent-modal assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 5: Add the background crowd slider

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- slider element exists
- minimum is `100`
- reference marks/labels include `1595` and `3190`
- scenario creation path accepts numeric crowd count from UI state

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current UI still uses the preset select and the core runtime still expects preset IDs.

**Step 3: Write minimal implementation**

Implement:
- slider UI and visible value output
- numeric crowd state in `src/app.js`
- scenario invalidation when slider changes
- minimal `src/core.js` support for using a numeric count when provided while preserving existing fallback behavior

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for slider assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 6: Rework 2D visual encoding for floor, nodes, and agents

**Files:**
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- floor fill is light gray rather than white
- floor outline is thin dark gray
- node class styling uses dark outline and smaller text
- agent dots are black and smaller
- node color rendering logic includes the approved groups

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because current visual encoding does not match the new contract.

**Step 3: Write minimal implementation**

Implement:
- CSS updates for floor and obstacle styling
- CSS updates for node labels and outlines
- `src/app.js` updates for node color mapping:
  - Exit A/B/C/D -> green shades
  - Chai Wan -> blue
  - Kennedy Town -> purple
  - Tsuen Wan -> red
  - elevator -> yellow
- smaller agent radius and black default dot fill
- preserve focus-agent clickability via invisible hit area

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for visual-contract assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 7: Replace old layer toggles with 10 category buttons

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- the old generic layer buttons are removed or no longer used
- 10 category buttons exist
- category mapping helpers exist in `src/app.js`
- category display colors are separate from node colors

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the current layer system is still generic.

**Step 3: Write minimal implementation**

Implement:
- 10-button layer area in `index.html`
- category-button styles in `styles.css`
- a single category-selection state in `src/app.js`
- imported pressure/seat mapping into:
  - `flashing ads`
  - `Static ads`
  - `AI virtual service ambassador`
  - `Common direction Signs`
  - `Customer Service Centre`
  - `Noise`
  - `Hanging Signs`
  - `LCD`
  - `Panoramic guide map`
  - `Seat`
- rendering only the currently selected category

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for category-button assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 8: Add point selection, popover display, and session-scoped edit state

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Step 1: Write the failing test**

Extend `scripts/validate_scenarios.js` to assert:
- point-popover container exists
- point selection state exists
- editable override state exists
- confirm/reset handlers exist
- read-only category handling exists

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because no point popover editor exists yet.

**Step 3: Write minimal implementation**

Implement:
- one-at-a-time point selection
- selected point highlight in the map
- point-adjacent popover positioning
- editable fields for:
  - `flashing ads`
  - `Static ads`
  - `Noise`
- read-only info display for:
  - `AI virtual service ambassador`
  - `Common direction Signs`
  - `Customer Service Centre`
  - `Hanging Signs`
  - `LCD`
  - `Panoramic guide map`
  - `Seat`
- per-point `Confirm` and `Reset`
- session-scoped override store

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for point-popover and edit-state assertions and still FAIL for remaining tasks.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 9: Feed edited values back into simulation reruns

**Files:**
- Modify: `src/app.js`
- Modify: `src/core.js`
- Test: `scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Add assertions that:
- edited pressure-point values are applied before scenario rebuild
- rerunning after edits changes the effective prepared data
- read-only categories do not expose mutable controls

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because edits are not yet part of scenario inputs.

**Step 3: Write minimal implementation**

Implement:
- a deterministic merge step from imported model data + edit overrides
- scenario rebuild path that uses merged pressure values
- ad-mode changes that update the effective feature/category parameters used by simulation
- numeric noise/lux changes that alter effective `strength`, `range`, or other already-supported simulation inputs according to the current mapping logic

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for rerun-with-edits assertions.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 10: Final verification

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

Document that 3D view remains deferred to a later batch and was intentionally not implemented here.
