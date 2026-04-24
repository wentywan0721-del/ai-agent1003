# Section 01 Route Stage Tweaks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refine the Section 01 route-setting page by changing the route-plan obstacle fill, converting the crowd number box into an underline input, and adding a hollow outer ring to the selected node.

**Architecture:** Keep all changes local to the existing Section 01 route planner. Use the existing validation script as the regression harness, then update `styles.css` for visual treatment and `src/app.js` for the selected-node SVG markup.

**Tech Stack:** Vanilla HTML/CSS/JS, existing Node-based validation scripts

---

### Task 1: Lock the new UI expectations in validation

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`

**Step 1: Write the failing test**

Extend the validation script so it requires:
- Section 01 obstacle fill to use the same route-stage panel token as the outer card
- `settings-crowd-input` to render as an underline-style input without a boxed border
- route selection markup to include a dedicated outer ring element for the active node

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: FAIL before CSS/JS is updated

### Task 2: Implement the visual changes

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Update route-stage and crowd input styling**

- Add a dedicated Section 01 route-stage fill token
- Use that same fill for the outer route card and obstacle polygons
- Restyle the crowd numeric input into an underline-style input

**Step 2: Add selected-node ring markup**

- Update `renderRouteSelectionMap()` so the active node renders:
  - one hollow outer ring
  - one inner solid node dot

**Step 3: Keep interaction unchanged**

- Do not change route picking logic
- Do not change any simulation or heatmap logic

### Task 3: Verify

**Files:**
- Verify only

**Step 1: Run syntax check**

Run: `node --check src/app.js`

**Step 2: Run layout regression**

Run: `node scripts/validate_settings_screen_layout.js`

**Step 3: Run first-pages regression**

Run: `node scripts/validate_first_pages_bugfixes.js`
