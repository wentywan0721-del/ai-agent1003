# WebGL Dynamic Crowd Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the main workspace dynamic crowd display with a WebGL renderer for background agents and the focus agent while keeping the existing UI, map, heatmap logic, and backend playback flow unchanged.

**Architecture:** Add a dedicated WebGL stage above the static map and below the interactive overlay, feed it from the existing playback/scenario state, and keep the legacy Canvas/SVG crowd path available as a fallback. Reuse the current transform and playback timing so the new renderer remains visually aligned with the map and heatmap.

**Tech Stack:** Vanilla JavaScript, WebGL, existing `src/app.js` playback loop, existing Node-based validation scripts

---

### Task 1: Add failing validation for the new renderer path

**Files:**
- Create: `scripts/validate_background_webgl_renderer.js`
- Modify: `src/app.js:1433-1485`
- Test: `scripts/validate_background_webgl_renderer.js`

**Step 1: Write the failing test**

Add a script that asserts:
- app state exposes a WebGL renderer mode
- app defines WebGL setup / draw helpers
- `renderPlaybackFrame()` calls the new WebGL render path
- legacy crowd canvas renderer no longer owns the default main-workspace draw path
- focus agent rendering can be suppressed from the old SVG overlay when WebGL is active

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: FAIL because the WebGL renderer path does not exist yet.

**Step 3: Write minimal implementation**

Introduce the smallest state/constants/scaffolding needed so the validation can discover the intended new path.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: PASS

### Task 2: Add the WebGL crowd layer and fallback plumbing

**Files:**
- Modify: `index.html:528-531`
- Modify: `styles.css:1750-1775`
- Modify: `src/app.js:1596-1605`
- Test: `scripts/validate_background_webgl_renderer.js`

**Step 1: Write the failing test**

Extend the validator to assert:
- a dedicated `webgl` crowd canvas exists in the main map stack
- the element is registered in `elements`
- it layers cleanly with the base map / heatmap / overlay

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: FAIL because the DOM layer does not exist yet.

**Step 3: Write minimal implementation**

Add the new canvas to the main map stack, style it to align with the existing stage, and wire it into the app element map.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: PASS

### Task 3: Implement WebGL initialization, resize, and batched draw

**Files:**
- Modify: `src/app.js:1433-1485`
- Modify: `src/app.js:6044-6087`
- Modify: `src/app.js:10061-10067`
- Test: `scripts/validate_background_webgl_renderer.js`
- Test: `scripts/validate_background_render_visibility.js`

**Step 1: Write the failing test**

Extend the validator to assert:
- a WebGL init helper exists
- a WebGL resize helper exists
- a WebGL draw helper exists
- playback rendering prefers the WebGL path in the main workspace
- the legacy canvas renderer is still present as a fallback function

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: FAIL because draw helpers are not implemented.

**Step 3: Write minimal implementation**

Implement:
- WebGL context acquisition with graceful failure
- shader/program setup for point drawing
- buffer uploads for background agents and the focus agent
- per-frame draw using the current transform dimensions
- automatic fallback to the old canvas path if WebGL cannot initialize

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_background_webgl_renderer.js`
- `node scripts/validate_background_render_visibility.js`
Expected: PASS

### Task 4: Remove dynamic point ownership from the old SVG overlay when WebGL is active

**Files:**
- Modify: `src/app.js:6088-6370`
- Test: `scripts/validate_background_webgl_renderer.js`
- Test: `scripts/validate_playback_render_split.js`

**Step 1: Write the failing test**

Extend the validator to assert:
- focus agent SVG circles are skipped when WebGL dynamic rendering is active
- overlay still renders non-agent interactive content

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_webgl_renderer.js`
Expected: FAIL because the overlay still owns focus-agent drawing.

**Step 3: Write minimal implementation**

Gate focus/background agent SVG generation behind the renderer mode so only non-agent overlay content remains in the old path.

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_background_webgl_renderer.js`
- `node scripts/validate_playback_render_split.js`
Expected: PASS

### Task 5: Verify playback, alignment, and regression coverage

**Files:**
- Modify: `scripts/validate_background_webgl_renderer.js`
- Test: `scripts/validate_background_webgl_renderer.js`
- Test: `scripts/validate_background_true_count.js`
- Test: `scripts/validate_background_platform_no_origin.js`
- Test: `scripts/validate_background_field_budget_sync.js`
- Test: `scripts/validate_background_queue_service_rules.js`
- Test: `scripts/validate_heatmap_playback_end_hold.js`
- Test: `scripts/validate_focus_progress_reference.js`
- Test: `scripts/validate_visualization_runtime_metric_sync.js`
- Test: `scripts/validate_heatmap_slim_payload.js`

**Step 1: Run focused renderer validations**

Run:
- `node scripts/validate_background_webgl_renderer.js`
- `node scripts/validate_background_render_visibility.js`
- `node scripts/validate_playback_render_split.js`

Expected: PASS

**Step 2: Run existing regression validations**

Run:
- `node scripts/validate_background_true_count.js`
- `node scripts/validate_background_platform_no_origin.js`
- `node scripts/validate_background_field_budget_sync.js`
- `node scripts/validate_background_queue_service_rules.js`
- `node scripts/validate_heatmap_playback_end_hold.js`
- `node scripts/validate_focus_progress_reference.js`
- `node scripts/validate_visualization_runtime_metric_sync.js`
- `node scripts/validate_heatmap_slim_payload.js`

Expected: PASS

**Step 3: Manual verification**

Check in the real page:
- `700` people, long route
- `1500` people, long route
- confirm no visible map/heatmap/dynamic-layer offset
- confirm focus agent still animates
- confirm fallback behavior if WebGL init fails
