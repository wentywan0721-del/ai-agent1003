# Visualization Workspace Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real analysis-loading transition after Section 01, then migrate the workspace into the confirmed Section 03 / Section 04 shell with a six-window heatmap layout and a right-side environment + elderly status panel without changing the existing simulation, heatmap computation, or route logic.

**Architecture:** Keep the current HTML/CSS/JS app and reuse the existing `base-layer`, `heatmap-layer`, `background-crowd-canvas`, `overlay-layer`, summary, inspector, and report data sources. Introduce a thin new UI screen state for loading, then rebuild the workspace shell around the existing render pipeline by drawing the current map/heat layers into six fixed view cards and moving status content into a new right panel.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, existing canvas/svg render pipeline, existing validation scripts.

---

### Task 1: Add loading-screen and workspace migration regressions

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_visualization_workspace_shell.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_analysis_loading_transition.js`

**Step 1: Write the failing tests**

Add file-structure checks for:
- `analysis-loading-screen`
- six heatmap cards in the new visualization grid
- right-side environment / elderly status / report panel
- settings start button progress binding and deferred workspace transition

**Step 2: Run tests to verify they fail**

Run:
- `node scripts/validate_visualization_workspace_shell.js`
- `node scripts/validate_analysis_loading_transition.js`

Expected:
- FAIL because the loading screen and new workspace shell do not exist yet.

**Step 3: Write minimal implementation hooks**

Add HTML ids/classes and app state placeholders only, enough to satisfy the initial shell tests.

**Step 4: Run tests to verify they pass**

Run the two validation scripts again.

**Step 5: Commit**

```bash
git add index.html src/app.js scripts/validate_visualization_workspace_shell.js scripts/validate_analysis_loading_transition.js
git commit -m "test: add visualization workspace migration guards"
```

### Task 2: Implement loading progress transition

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`

**Step 1: Write the failing test**

Extend `validate_analysis_loading_transition.js` to require:
- `handleSettingsStartAnalysis()` does not jump directly to `workspace`
- loading state uses existing compute progress
- workspace transition happens only after generation + heatmap completion

**Step 2: Run test to verify it fails**

Run:
- `node scripts/validate_analysis_loading_transition.js`

Expected:
- FAIL because the current code still jumps directly into workspace.

**Step 3: Write minimal implementation**

Add:
- `uiScreen: 'analysis-loading'` state
- start-analysis orchestration that triggers existing crowd + heatmap flow
- progress text on the Section 01 button
- auto-enter workspace after heatmap is ready

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_analysis_loading_transition.js`

**Step 5: Commit**

```bash
git add src/app.js styles.css scripts/validate_analysis_loading_transition.js
git commit -m "feat: add analysis loading transition"
```

### Task 3: Rebuild workspace shell as Section 03 / Section 04

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Write the failing test**

Extend `validate_visualization_workspace_shell.js` to require:
- Section 03 title shell
- custom 6-card visualization grid matching the approved proportions
- no per-card stress button
- right panel sections for environment parameters, elderly status monitor, capability radar, burden feedback, and export button

**Step 2: Run test to verify it fails**

Run:
- `node scripts/validate_visualization_workspace_shell.js`

Expected:
- FAIL because the legacy workspace shell is still active.

**Step 3: Write minimal implementation**

Replace the visible workspace HTML/CSS shell while preserving current ids and rendering anchors where needed. Add the six heatmap cards, map-title blocks, description rows, fixed min/max placeholders, and right-side panel layout.

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_visualization_workspace_shell.js`

**Step 5: Commit**

```bash
git add index.html styles.css src/app.js scripts/validate_visualization_workspace_shell.js
git commit -m "feat: migrate workspace shell to section 03 layout"
```

### Task 4: Bind existing render/state data into the new shell

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`

**Step 1: Write the failing test**

Add checks for:
- environment parameter labels in the right panel
- path progress metric binding
- per-view min/max values
- radar / burden feedback / report button rendered inside the new right panel

**Step 2: Run test to verify it fails**

Run:
- `node scripts/validate_visualization_workspace_shell.js`

Expected:
- FAIL because the new shell is not wired to live data yet.

**Step 3: Write minimal implementation**

Reuse current state and helper functions to populate:
- origin / destination / current crowd / travel time / congestion / path progress / noise / lighting / queue count
- elderly status monitor
- capability radar
- burden feedback
- export report button

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_visualization_workspace_shell.js`

**Step 5: Commit**

```bash
git add src/app.js styles.css scripts/validate_visualization_workspace_shell.js
git commit -m "feat: bind workspace visualization shell to live data"
```

### Task 5: Verify end-to-end behavior

**Files:**
- Verify only

**Step 1: Run syntax and regression checks**

Run:
- `node --check src/app.js`
- `node --check data/unified-rules.js`
- `node scripts/validate_first_pages_bugfixes.js`
- `node scripts/validate_settings_screen_layout.js`
- `node scripts/validate_analysis_loading_transition.js`
- `node scripts/validate_visualization_workspace_shell.js`

**Step 2: Run existing related UI checks**

Run:
- `node scripts/validate_ui_micro_tuning.js`
- `node scripts/validate_settings_dynamic_descriptions.js`
- `node scripts/validate_radar_text_alignment.js`

**Step 3: Manual smoke checks**

Confirm:
- Section 01 button shows progress during analysis
- analysis completes before workspace appears
- six heatmap cards render without large white gaps
- right panel shows environment parameters and elderly status
- report export button still works

**Step 4: Commit**

```bash
git add .
git commit -m "feat: migrate visualization workspace"
```
