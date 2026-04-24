# Report Analysis Skeleton Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the existing route report foundation with a shared analysis skeleton that supports Section 04 and future LLM-backed report content without changing simulation logic.

**Architecture:** Keep the existing export flow and HTML report shell. Expand the shared snapshot in `src/app.js` with structured summary blocks, then reuse those blocks in both the report modal summary and exported HTML document. Add only lightweight validation for the new skeleton so the current report/export path remains stable.

**Tech Stack:** Vanilla JavaScript, existing report modal/export pipeline, Node validation scripts.

---

### Task 1: Expand the shared report snapshot

**Files:**
- Modify: `src/app.js`

**Step 1: Add lightweight structured fields**

Add shared snapshot blocks for:
- executive summary
- input snapshot
- route pressure statistics
- future LLM input payload

**Step 2: Keep all fields derived from existing state**

Reuse current route selection, focus profile, summary, hotspots, prepared model counts, and active pressure objects.

### Task 2: Reuse the shared snapshot in report summary and export

**Files:**
- Modify: `src/app.js`

**Step 1: Update the report modal summary**

Show the new summary structure in the left summary rail without changing the export flow.

**Step 2: Update the exported HTML document**

Insert the new report skeleton sections so the exported report is closer to the approved content outline while remaining placeholder-safe for future LLM content.

### Task 3: Add focused validation

**Files:**
- Modify: `scripts/validate_report_analysis_foundation.js`

**Step 1: Assert the new skeleton blocks exist**

Check for executive summary, input snapshot, route pressure statistics, and future LLM input payload fields.

**Step 2: Verify syntax and report validation**

Run:
- `node --check src/app.js`
- `node scripts/validate_report_analysis_foundation.js`
- `node scripts/validate_visualization_detail_report_layout.js`
