# Agent Preview Compositing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the Section 02 agent preview renderer with precise transparent-image compositing so locomotor score chooses the pose and each five-dimension body region is cropped from the matching score-colored source art.

**Architecture:** Keep the current UI wiring in `src/app.js`, but swap the preview image generation path from flood-fill tinting to deterministic region compositing. The new renderer will use the user-provided transparent PNGs as source-of-truth, crop each pose to its visible bounds, then assemble the final preview by combining the locomotor-selected base pose with dimension-specific region overlays from the corresponding score-colored pose assets.

**Tech Stack:** Vanilla JavaScript, browser canvas/image APIs, existing custom validation scripts, static PNG assets.

---

### Task 1: Define the new preview asset contract

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\assets\agent-poses\*.png`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_pose_assets.js`

**Step 1: Write the failing test**

Add assertions that the preview renderer can load the five locomotor pose assets, that the assets come from `assets/agent-poses`, and that the image generation path no longer depends on the legacy flood-fill mask pipeline.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_pose_assets.js`
Expected: FAIL because the code still references the old mask-driven tint renderer.

**Step 3: Write minimal implementation**

Update the asset source mapping and preview metadata so each locomotor score uses the replaced transparent PNGs as the canonical pose images.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_pose_assets.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js assets/agent-poses/*.png scripts/validate_agent_visual_preview_pose_assets.js
git commit -m "feat: replace agent preview pose assets"
```

### Task 2: Lock the crop-based compositing API

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_compositing.js`

**Step 1: Write the failing test**

Create a validation that generates the Section 02 preview with mixed scores, verifies locomotor selects the base pose, and verifies each dimension region can be sourced from a different score image without recoloring the full figure.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_compositing.js`
Expected: FAIL because the existing implementation flood-fills white areas instead of compositing exact cropped regions.

**Step 3: Write minimal implementation**

Add a new image generation pipeline that:
- crops the visible figure bounds from each transparent source image
- normalizes all five source images into the same preview frame
- composes the locomotor-selected full figure first
- overlays cropped region fragments for cognitive, sensory, psychological, vitality, and locomotor from the score-matching source images

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_compositing.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_compositing.js
git commit -m "feat: compose agent preview from transparent pose regions"
```

### Task 3: Remove obsolete preview tint logic

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_compositing.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_binding.js`

**Step 1: Write the failing test**

Extend validation coverage to assert that the preview generation path no longer calls or exports legacy flood-fill helpers and still updates the right-side preview when scores change.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_agent_visual_preview_compositing.js`
Run: `node scripts/validate_agent_visual_preview_binding.js`
Expected: FAIL until the old helper usage is removed and the UI still binds correctly.

**Step 3: Write minimal implementation**

Delete the unused flood-fill, boundary-map, and line-art transformation helpers that belonged to the previous recoloring approach, then keep only the crop/compositing path and any metadata still needed for connector anchors and highlight cards.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_agent_visual_preview_compositing.js`
Run: `node scripts/validate_agent_visual_preview_binding.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_compositing.js scripts/validate_agent_visual_preview_binding.js
git commit -m "refactor: remove legacy agent preview tint pipeline"
```

### Task 4: Final verification

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_pose_assets.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_compositing.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_agent_visual_preview_binding.js`

**Step 1: Run targeted validations**

```bash
node scripts/validate_agent_visual_preview_pose_assets.js
node scripts/validate_agent_visual_preview_compositing.js
node scripts/validate_agent_visual_preview_binding.js
```

Expected: All PASS

**Step 2: Manual sanity check**

Open the app and verify:
- locomotor `1` shows the wheelchair pose
- mixed scores keep the locomotor pose but swap only the requested body regions
- no white background or synthetic recolor halo appears around the figure

**Step 3: Commit**

```bash
git add src/app.js scripts/validate_agent_visual_preview_pose_assets.js scripts/validate_agent_visual_preview_compositing.js
git commit -m "test: verify agent preview transparent compositing"
```
