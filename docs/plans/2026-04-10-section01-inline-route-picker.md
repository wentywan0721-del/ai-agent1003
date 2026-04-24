# Section 01 Inline Route Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Section 01 radar/description columns with one large inline route-selection map while keeping the existing route draft/confirm logic and core simulation pipeline unchanged.

**Architecture:** Reuse the existing route-selection draft state (`state.routeModal`) as the temporary selection model, but render the route map and target-region controls directly inside Section 01 instead of relying on the modal. Keep the old route modal container only as compatibility markup, and move active interaction to new Section 01 elements so uploaded model handling, route confirmation, and downstream scenario generation remain stable.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript in `src/app.js`, Node-based validation scripts.

---

### Task 1: Reshape Section 01 markup

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`

**Step 1: Write the failing test**

Create or update a validation script that asserts:
- Section 01 no longer contains `settings-capacity-radar`
- Section 01 no longer contains `settings-dimension-list`
- Section 01 contains inline route map elements and destination dropdown elements

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: FAIL against the old radar/list expectations.

**Step 3: Write minimal implementation**

Update `index.html` so:
- the upload card keeps its inner icon
- the left form includes origin placeholder, destination trigger, clear/confirm buttons, and crowd input
- the right side becomes one large inline route-planning card with a map mount

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: PASS

### Task 2: Restyle Section 01 for inline route planning

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`

**Step 1: Write the failing test**

Extend validation to assert:
- divider spacing is `40px`
- origin/destination fields use brighter blue/red tinting
- the new inline route planner card exists in CSS

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: FAIL until CSS is updated.

**Step 3: Write minimal implementation**

Update `styles.css` so:
- the two section dividers stretch full width with 40px spacing above and below
- upload icon is visible again
- origin/destination fields have brighter tinted backgrounds
- crowd slider and numeric field share the reference glass styling
- the inline map panel fills the removed middle/right columns

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: PASS

### Task 3: Rewire inline route draft interactions

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Write the failing test**

Add validation assertions for:
- new DOM bindings for the inline destination trigger/menu and inline route map
- route map rendering function references the inline map container
- destination dropdown options render from the prepared target regions

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: FAIL before JS is updated.

**Step 3: Write minimal implementation**

Update `src/app.js` so:
- Section 01 uses placeholder text until a start node or target region is drafted
- clicking a map node updates the draft start node immediately
- clicking the destination trigger opens a dropdown with the seven target-region names
- clear resets both draft and confirmed route
- confirm commits the draft to `state.routeSelection`
- the route modal stops driving the user flow

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: PASS

### Task 4: Verify syntax and targeted UI validation

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`

**Step 1: Run syntax check**

Run: `node --check src/app.js`
Expected: PASS

**Step 2: Run targeted validation**

Run: `node scripts/validate_settings_screen_layout.js`
Expected: PASS

**Step 3: Sanity-check related validation if needed**

Run: `node scripts/validate_first_pages_bugfixes.js`
Expected: PASS unless the new inline route flow intentionally replaced an old selector assertion.
