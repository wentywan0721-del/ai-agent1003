# Heatmap Palette And Legend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the psychological, cognitive, and vitality heatmaps with view-specific palettes, add a dynamic legend in the viewport header, and show vitality growth-rate using ribbon width.

**Architecture:** Keep the existing raster heatmap pipeline, but split color/legend concerns into per-view style configuration. Reuse the cumulative playback trace for vitality and overlay a second smooth ribbon whose width encodes local fatigue-growth rate while the underlying color still encodes cumulative vitality burden.

**Tech Stack:** Vanilla HTML/CSS/JS, canvas heatmap rendering in `src/app.js`, scenario playback data from `src/core.js`, source-based validation scripts in `scripts/`.

---

### Task 1: Add a failing validation for palette and legend support

**Files:**
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_palettes.js`

**Step 1: Write the failing test**

Assert that:
- `index.html` contains `id="view-heat-legend"`
- `src/app.js` contains `getHeatmapViewStyle`
- `src/app.js` contains `renderViewHeatLegend`
- `src/app.js` contains `paintVitalityRateRibbon`

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_heatmap_palettes.js`

Expected: FAIL because these hooks do not exist yet.

### Task 2: Add viewport legend shell and styling

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`

**Step 1: Add legend mount below the viewport header controls**

Use a dedicated legend container so the middle panel can swap legend content by current view.

**Step 2: Style the legend**

Make the legend compact, glassy, and clearly readable on top of the existing panel without changing the confirmed layout structure.

### Task 3: Add per-view palette/legend configuration in the renderer

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Add per-view palette definitions**

Keep locomotor/sensory on the current palette. Add dedicated palettes for:
- psychological: mint -> warm coral -> red
- cognitive: pale lavender -> deep purple
- vitality: blush pink -> wine red

**Step 2: Add legend rendering**

Render different legend labels for psychological, cognitive, and vitality. Vitality legend must include an extra width cue for “growth rate”.

### Task 4: Add vitality width-encoding overlay

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Compute local vitality growth rate from visible trace snapshots**

Use adjacent visible playback snapshots and compare vitality metric change along the path.

**Step 2: Draw a smooth path ribbon**

Keep color tied to cumulative vitality burden, and map growth-rate to path width.

### Task 5: Verify

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_palettes.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Run the palette validation**

Run: `node scripts/validate_heatmap_palettes.js`

Expected: PASS

**Step 2: Run syntax validation**

Run: `node --check src/app.js`

Expected: PASS
