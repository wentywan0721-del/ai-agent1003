# Three-Page Report Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current export report content with a print-friendly three-page portrait A4 report covering model/input info, simulation/thought chain info, and six heatmaps.

**Architecture:** Keep all simulation and UI runtime logic unchanged. Only extend the report-export data builder and HTML template in `src/app.js`, plus add report-only helper functions that compute model statistics, playback summaries, and static SVG/canvas snapshots for the exported document.

**Tech Stack:** Vanilla JS, existing report HTML export flow, inline SVG, canvas data URLs, existing simulation state helpers.

---

### Task 1: Add Report-Only Data Extractors

**Files:**
- Modify: `src/app.js`

**Steps:**
1. Add helpers for model area, node-type counts, pressure-category counts, and playback metric min/max extraction.
2. Add helpers for route/thought-chain/pressure-point report data without mutating runtime state.
3. Add helpers that convert report stages into static SVG/canvas assets for the exported HTML only.

### Task 2: Rebuild Report Data Shape

**Files:**
- Modify: `src/app.js`

**Steps:**
1. Replace the old summary-oriented `buildRouteReportData(...)` output with a new three-page data model.
2. Keep locale support and existing filename/export flow intact.
3. Ensure all new sections degrade gracefully when optional data is missing.

### Task 3: Replace Exported HTML Template

**Files:**
- Modify: `src/app.js`

**Steps:**
1. Rebuild `buildRouteReportDocument(...)` as portrait A4 paged HTML.
2. Page 1: title/meta, model table, input parameters, radar + agent figure + dimension descriptions.
3. Page 2: simulation parameter table, thought-chain text strip, route map with path/decision points/pressure points, pressure legend/list.
4. Page 3: six heatmap cards in 2x3 layout with title, description, min/max burden, and in-card legend.

### Task 4: Add Regression Check

**Files:**
- Create: `scripts/validate_report_export_three_pages.js`

**Steps:**
1. Build report data/document from local default model state.
2. Assert the generated HTML contains three A4 page markers and the required major section headings.
3. Run the validation script after implementation.
