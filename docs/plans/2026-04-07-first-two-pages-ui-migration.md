# First Two Pages UI Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the first two product pages to the approved reference UI while keeping the existing simulator core, route modal logic, heatmap logic, and runtime rule chain unchanged.

**Architecture:** Add a lightweight screen-state shell on top of the current single-page app. Rebuild the landing page and the Section 01 settings page in the current `index.html` / `styles.css` / `src/app.js` stack, then reuse existing file import, route-picking modal, crowd slider, and five-dimension agent logic as the data layer behind the new UI.

**Tech Stack:** Native HTML, CSS, JavaScript, existing SVG/canvas rendering, existing in-app locale system, custom Node validation scripts.

---

### Task 1: Add failing validation coverage for the new page shell

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_landing_title_layout.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_landing_title_layout.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`

**Step 1: Write the failing test**

Add assertions for:
- landing page fixed language toggle shell
- landing fade-transition class hooks
- settings screen container and three-column structure
- settings screen route summary fields
- settings screen radar host and dimension description list

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_landing_title_layout.js`

Expected: FAIL because the current landing page is only a simplified placeholder.

Run: `node scripts/validate_settings_screen_layout.js`

Expected: FAIL because the new settings screen does not exist yet.

**Step 3: Write minimal implementation**

Do not implement in this task.

**Step 4: Run test to verify it passes**

Do not run yet.

**Step 5: Commit**

Skip commit in this workspace if `.git` is unavailable.

### Task 2: Implement the landing page shell and transition

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_landing_title_layout.js`

**Step 1: Write the failing test**

Use the updated landing validation to assert:
- full-screen video landing shell
- two-line title
- fixed top-right language toggle
- fade-out transition state before entering the next screen

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_landing_title_layout.js`

Expected: FAIL on missing full reference shell and transition hooks.

**Step 3: Write minimal implementation**

Implement:
- `uiScreen` / transition state in `src/app.js`
- landing markup in `index.html`
- reference-style landing CSS in `styles.css`
- locale copy for landing tag, title, description, button
- start-button fade transition into the settings screen

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_landing_title_layout.js`

Expected: PASS

**Step 5: Commit**

Skip commit in this workspace if `.git` is unavailable.

### Task 3: Implement the Section 01 settings page shell

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`

**Step 1: Write the failing test**

Use the new settings validation to assert:
- header/back button structure
- left upload card and route action button
- read-only origin/destination fields
- center radar panel host
- right-side five-dimension description cards

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_settings_screen_layout.js`

Expected: FAIL because the settings page has not been added yet.

**Step 3: Write minimal implementation**

Implement:
- settings screen markup and screen-state visibility
- reference-style upload card and crowd slider shell
- route button wired to existing route modal
- origin/destination display fields bound to existing route selection state
- radar panel host using the current five-dimension editor logic
- right-side dimension description cards using current locale copy
- visible `Mobility` wording while keeping internal `locomotor` ids

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_settings_screen_layout.js`

Expected: PASS

**Step 5: Commit**

Skip commit in this workspace if `.git` is unavailable.

### Task 4: Reconnect legacy workspace entry without touching core logic

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`

**Step 1: Write the failing test**

Rely on layout/state validation and syntax checks for this task.

**Step 2: Run test to verify it fails**

Not isolated separately.

**Step 3: Write minimal implementation**

Implement:
- settings page back action to landing
- settings page analyze action into the existing legacy workspace
- visibility classes so the legacy workspace remains intact but inactive until reached

**Step 4: Run test to verify it passes**

Validate through the layout scripts plus `node --check src/app.js`.

**Step 5: Commit**

Skip commit in this workspace if `.git` is unavailable.

### Task 5: Final verification

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_landing_title_layout.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_settings_screen_layout.js`

**Step 1: Write the failing test**

No new test file.

**Step 2: Run test to verify it fails**

Not applicable.

**Step 3: Write minimal implementation**

No implementation.

**Step 4: Run test to verify it passes**

Run:
- `node --check src/app.js`
- `node scripts/validate_landing_title_layout.js`
- `node scripts/validate_settings_screen_layout.js`

Expected: all commands succeed with exit code `0`.

**Step 5: Commit**

Skip commit in this workspace if `.git` is unavailable.
