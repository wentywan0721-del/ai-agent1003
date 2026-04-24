# Composite Burden View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a composite burden overview mode and retune all burden heatmap palettes while preserving the current UI structure.

**Architecture:** Keep all simulation burden calculations unchanged. Compute the composite score in the front-end inspection/rendering path as the equal-weight average of the five existing `0-100` burden values. Reuse the existing hotspot panel layout by feeding it composite ranking cards with view-switch actions.

**Tech Stack:** Plain JavaScript, existing `src/app.js`, existing `src/inspector-utils.js`, Node validation scripts

---

### Task 1: Lock expected behavior in tests

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_inspector_panel.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_palettes.js`

**Step 1: Write the failing test**

- Add a composite inspector-panel expectation:
  - returns five ranked items
  - ranks by current burden value descending
  - includes click-through view ids for switching to a single burden view
- Add palette expectations:
  - `composite` view style exists
  - app source includes the new per-view legend wording and composite view wiring

**Step 2: Run test to verify it fails**

Run:
- `node scripts/validate_inspector_panel.js`
- `node scripts/validate_heatmap_palettes.js`

Expected: FAIL because composite mode and the new palette wiring do not exist yet

### Task 2: Implement the minimal front-end changes

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\inspector-utils.js`

**Step 1: Write minimal implementation**

- Add a `composite` burden view id to the existing view-mode flow.
- Add helper functions for:
  - composite burden score from five single burdens
  - extended burden-score lookup for composite mode
- Wire composite values into:
  - view select labels
  - legend rendering
  - runtime heatmap metric lookup
  - dynamic inspection burden scores
- In `inspector-utils`, add composite panel item generation:
  - five burden cards
  - descending order
  - action metadata pointing to the target single burden view
- In `app.js`, update hotspot card click handling so composite cards switch the active view.
- Replace the five single-view palettes plus add the composite gradient palette.

**Step 2: Run tests to verify it passes**

Run:
- `node scripts/validate_inspector_panel.js`
- `node scripts/validate_heatmap_palettes.js`

Expected: PASS

### Task 3: Regression check

**Files:**
- No additional code changes expected

**Step 1: Run focused validations**

Run:
- `node --check src/app.js`
- `node --check src/inspector-utils.js`
- `node scripts/validate_local_playback_runtime_heat.js`

**Step 2: Summarize outcome**

- Report the new composite-view behavior, the click-through ranking logic, and the updated color families.
