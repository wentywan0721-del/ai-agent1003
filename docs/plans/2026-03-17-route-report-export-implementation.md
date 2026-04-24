# Route Report Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a right-panel export action that opens a preview modal and exports a single-route Chinese HTML diagnostic report after the heatmap has been run.

**Architecture:** Keep the app as a plain HTML/CSS/JS single-page prototype. Extend the existing inspector panel and modal system in `index.html`, add report-modal layout styles in `styles.css`, and implement report state, data assembly, preview rendering, and HTML export in `src/app.js` using current scenario outputs instead of introducing a new analysis pipeline.

**Tech Stack:** Plain HTML, CSS, vanilla JavaScript, existing frontend simulation state, `scripts/validate_scenarios.js`, Node syntax checks, browser verification with local static hosting.

---

### Task 1: Lock the report-export contract in validation

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Inspect: `index.html`
- Inspect: `styles.css`
- Inspect: `src/app.js`

**Step 1: Write the failing test**

Add validator assertions for:
- right-panel `导出报告` button hook
- report modal container, preview iframe, and export / close action hooks
- report modal styles in `styles.css`
- report state plus generation/export helpers in `src/app.js`
- File System Access API save path and download fallback path

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL because the report UI and logic do not exist yet.

**Step 3: Write minimal implementation**

Only update the validator to describe the approved target behavior.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL against missing production hooks, not because of validator syntax.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 2: Add the report entry point and modal structure

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

**Step 1: Write the failing test**

Use the validator assertions from Task 1 to cover:
- inspector-bottom export section
- report modal shell
- preview frame
- close and export buttons

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL because the DOM hooks are still absent.

**Step 3: Write minimal implementation**

Implement:
- a bottom inspector action section
- a full-width `导出报告` button
- a new report modal after the existing modals
- a left summary/actions rail and right preview stage
- minimal responsive layout and action-state styling

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: DOM/style assertions pass while app-logic assertions still fail.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 3: Build report state, preview rendering, and export logic

**Files:**
- Modify: `src/app.js`

**Step 1: Write the failing test**

Use the validator assertions from Task 1 to cover:
- report modal state in the app store
- report generation helpers
- preview iframe rendering hook
- export handler using `showSaveFilePicker`
- blob-download fallback

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`
Expected: FAIL because report state and handlers are missing.

**Step 3: Write minimal implementation**

Implement:
- `state.reportModal`
- element references for the new modal
- `openReportModal()` and `closeReportModal()`
- `buildRouteReportData()`
- `buildRouteReportDocument()`
- preview rendering through `iframe.srcdoc`
- `handleExportReport()` with save-picker path and fallback download path
- button enable/disable logic tied to `state.scenario?.heatActive`
- modal reset when scenario is invalidated or a new model is loaded

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`
Expected: PASS for new report hooks and export logic.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 4: Verify the end-to-end route-report flow

**Files:**
- Inspect: `index.html`
- Inspect: `styles.css`
- Inspect: `src/app.js`
- Inspect: exported `.html` output if generated during verification

**Step 1: Write the failing test**

No new automated test for this step; use the existing validator and browser check as the acceptance gate.

**Step 2: Run test to verify it fails**

Not applicable.

**Step 3: Write minimal implementation**

No new implementation. Verify the complete route-report flow:
- load the app
- select a route
- generate crowd
- run heatmap
- open report modal
- confirm preview content appears
- export HTML successfully

**Step 4: Run test to verify it passes**

Run:
- `node --check src/app.js`
- `node scripts/validate_scenarios.js`
- browser verification on a local static server

Expected:
- syntax check passes
- validator passes
- preview/export flow works without breaking existing route or agent modals

**Step 5: Commit**

Skip. This workspace is not a git repository.
