# Agent Visual Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a live agent visual preview panel to Section 02 that updates the elder figure pose, body-region glow, and dimension descriptions as the five capacity scores change.

**Architecture:** Keep the existing left radar editor intact and replace the current middle-empty plus right-description area with one combined visual panel. Drive the new preview entirely from the existing editable capacity scores in `state.agentModal.draft`, using front-end rendering only and no changes to simulation rules or the main calculation chain.

**Tech Stack:** Vanilla HTML, CSS, JavaScript in `index.html`, `styles.css`, `src/app.js`

---

### Task 1: Add Section02 visual-preview container structure

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_layout.js`

**Step 1: Write the failing test**

Create a validation script that checks Section 02 contains:
- one merged visual panel container
- one figure stage container
- one connector overlay container
- one description list container

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_layout.js`  
Expected: FAIL because the new structure does not exist yet

**Step 3: Write minimal implementation**

Update `index.html` to:
- remove the empty middle card
- replace the current right-side description-only section with a single merged panel
- add named child nodes for:
  - figure stage
  - line connector layer
  - ordered description cards

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_layout.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add index.html scripts/validate_agent_visual_preview_layout.js
git commit -m "feat: add section02 visual preview layout"
```

### Task 2: Define visual-panel styles

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_styles.js`

**Step 1: Write the failing test**

Create a validation script that checks for CSS selectors covering:
- merged visual panel
- figure column
- description column
- connector line styling
- glowing body region styling
- responsive fallback for narrow screens

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_styles.js`  
Expected: FAIL because the styles do not exist yet

**Step 3: Write minimal implementation**

Add CSS for:
- merged right-side panel layout
- left figure stage / right description stack
- white line-art look
- semi-transparent fills
- dashed white connectors
- dimension description card styling
- mobile single-column fallback

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_styles.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add styles.css scripts/validate_agent_visual_preview_styles.js
git commit -m "feat: style section02 visual preview panel"
```

### Task 3: Add preview color scale and body-region mapping helpers

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_mapping.js`

**Step 1: Write the failing test**

Create a validation script that checks `src/app.js` defines:
- a five-level preview color map
- a body-region map for `cognitive`, `sensory`, `psychological`, `vitality`, `locomotor`
- a locomotor pose selector for scores `1-5`

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_mapping.js`  
Expected: FAIL because these helpers do not exist yet

**Step 3: Write minimal implementation**

Add app-level helpers for:
- preview score to color mapping
- locomotor score to figure type mapping
- dimension id to figure-region metadata mapping

Do not wire rendering yet.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_mapping.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_mapping.js
git commit -m "feat: add agent visual preview mapping helpers"
```

### Task 4: Render the five locomotor figure variants

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_figures.js`

**Step 1: Write the failing test**

Create a validation script that checks app code defines rendering branches or templates for:
- standing figure variants
- walker figure
- wheelchair figure

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_figures.js`  
Expected: FAIL because figure rendering is not implemented yet

**Step 3: Write minimal implementation**

Implement a renderer that outputs a white line-art figure for the current locomotor score:
- `5/4/3`: standing body
- `2`: walker pose
- `1`: wheelchair pose

Keep pose logic strict to the approved design.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_figures.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_figures.js
git commit -m "feat: render section02 locomotor figure variants"
```

### Task 5: Render body-region glow overlays

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_glow.js`

**Step 1: Write the failing test**

Create a validation script that checks the preview renderer outputs separate region layers for:
- cognitive
- sensory
- psychological
- vitality
- locomotor

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_glow.js`  
Expected: FAIL because body glow layers are not rendered yet

**Step 3: Write minimal implementation**

Add glow overlays using the five-level preview color map:
- core fill
- outer glow
- no score mixing

Ensure the glow region stays fixed to the corresponding body position.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_glow.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_glow.js
git commit -m "feat: add section02 body-region glow overlays"
```

### Task 6: Render the ordered description cards

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_cards.js`

**Step 1: Write the failing test**

Create a validation script that checks the card renderer outputs the fixed order:
- cognitive
- sensory
- psychological
- vitality
- locomotor

and includes:
- dimension title
- score
- description text

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_cards.js`  
Expected: FAIL because the new description cards do not exist yet

**Step 3: Write minimal implementation**

Build a new Section 02 card renderer that:
- uses current editable scores
- reuses the existing description source
- displays one card per dimension in the approved order

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_cards.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_cards.js
git commit -m "feat: render section02 agent description cards"
```

### Task 7: Render dashed connectors between body regions and cards

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_connectors.js`

**Step 1: Write the failing test**

Create a validation script that checks the preview panel includes:
- connector line rendering
- dashed white line style
- linkage from each body region to its matching card

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_connectors.js`  
Expected: FAIL because no connector layer exists yet

**Step 3: Write minimal implementation**

Add a connector overlay layer using SVG or absolutely positioned line elements:
- one connector per dimension
- fixed right-side card mapping
- white dashed line styling

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_connectors.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js styles.css scripts/validate_agent_visual_preview_connectors.js
git commit -m "feat: connect preview body regions to description cards"
```

### Task 8: Wire preview rendering into Section02 updates

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_binding.js`

**Step 1: Write the failing test**

Create a validation script that checks:
- Section 02 render path calls the new preview renderer
- preview uses `state.agentModal.draft.capacityScores`
- preview updates from the same live radar draft source

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_binding.js`  
Expected: FAIL because the new preview is not wired yet

**Step 3: Write minimal implementation**

Update `renderSettingsScreen()` to:
- render the new figure panel
- render cards
- render connectors
- keep left radar behavior unchanged

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_binding.js`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_binding.js
git commit -m "feat: bind section02 visual preview to live scores"
```

### Task 9: Verify syntax and regression coverage

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\styles.css`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\index.html`

**Step 1: Run syntax check**

Run: `node --check src/app.js`  
Expected: PASS

**Step 2: Run new validations**

Run:

```bash
node scripts/validate_agent_visual_preview_layout.js
node scripts/validate_agent_visual_preview_styles.js
node scripts/validate_agent_visual_preview_mapping.js
node scripts/validate_agent_visual_preview_figures.js
node scripts/validate_agent_visual_preview_glow.js
node scripts/validate_agent_visual_preview_cards.js
node scripts/validate_agent_visual_preview_connectors.js
node scripts/validate_agent_visual_preview_binding.js
```

Expected: all PASS

**Step 3: Run nearby existing validations**

Run:

```bash
node scripts/validate_settings_screen_layout.js
node scripts/validate_settings_dynamic_descriptions.js
node scripts/validate_visualization_detail_radar_binding.js
```

Expected: all PASS

**Step 4: Commit**

```bash
git add src/app.js styles.css index.html scripts/validate_agent_visual_preview_*.js
git commit -m "feat: add section02 agent visual preview"
```
