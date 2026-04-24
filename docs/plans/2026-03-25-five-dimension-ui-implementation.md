# Five-Dimension UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add five capacity sliders to the agent modal and a five-view burden selector above the main viewport while preserving the existing age, gender, BMI, route, and report workflow.

**Architecture:** Keep the existing single-page HTML/CSS/JS structure. Extend the agent profile state so age, gender, and BMI continue driving the legacy base profile while the five capacity sliders pass explicit `capacityScores` into the unified rules layer. Add a viewport-level select control that switches heatmap rendering between locomotor, sensory, cognitive, psychological, and vitality burden values derived from the precomputed playback snapshots.

**Tech Stack:** Vanilla HTML, CSS, browser JavaScript, Node validation script.

---

### Task 1: Add failing validation for new UI entry points

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/scripts/validate_scenarios.js`

**Step 1: Write the failing test**

Add assertions for:
- agent modal capacity sliders and value labels
- viewport view-mode select
- exported app hooks for capacity-aware rendering

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL because the new ids and hooks do not exist yet.

**Step 3: Write minimal implementation**

Implement only the HTML/JS/CSS needed to satisfy the new assertions.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: PASS

### Task 2: Extend agent modal state and UI

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/index.html`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/styles.css`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`

**Step 1: Write the failing test**

Assert that:
- each capacity slider id exists
- agent draft/focus profile includes `capacityScores`
- summary text can show the five-dimension setup

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL on missing slider ids or missing hooks.

**Step 3: Write minimal implementation**

Add:
- five sliders in the existing agent modal form
- slider value chips
- state sync helpers for `capacityScores`
- keep age/gender/BMI untouched as base profile inputs

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: PASS

### Task 3: Add viewport view selector and map rendering switch

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/index.html`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/styles.css`
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`

**Step 1: Write the failing test**

Assert that:
- a viewport select exists
- render helpers support the five burden ids
- playback inspection exposes burden scores

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL because the selector and mode switch do not exist yet.

**Step 3: Write minimal implementation**

Add:
- top viewport select
- state for current burden view
- heatmap metric selection from playback snapshot burden values

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: PASS

### Task 4: Update report and inspector outputs

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`

**Step 1: Write the failing test**

Assert that:
- report data records current view mode
- inspector still renders burden details

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL on missing view-mode strings or report fields.

**Step 3: Write minimal implementation**

Update report snapshot and inspector copy so the selected burden view is explicit.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: PASS

### Task 5: Final verification

**Files:**
- Modify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/scripts/validate_scenarios.js`
- Verify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/app.js`
- Verify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/src/core.js`
- Verify: `E:/courses/S4/MUDT1003设计/新建文件夹/codex/index.html`

**Step 1: Run syntax checks**

Run:
- `node --check src/app.js`
- `node --check src/core.js`

Expected: PASS

**Step 2: Run scenario validation**

Run: `node scripts/validate_scenarios.js`
Expected: PASS

**Step 3: Manual smoke summary**

Confirm:
- agent modal still opens
- five sliders keep values
- view select changes the active burden map
- route report still opens and exports
