# Heatmap Visual Unification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改 UI 结构、不把非疲劳视图改成路径 ribbon 的前提下，统一疲劳与非疲劳热力图的共同显示链，并修正非疲劳视图的窄带、栅格感和锯齿问题。

**Architecture:** 保留规则层差异：疲劳仍然使用 ribbon 几何与宽度变化，非疲劳仍然使用真实热力场。统一显示层：两者都先渲染到高分辨率离屏 surface，再走同一套 walkable clip、reveal mask、obstacle clear 和主画布呈现链。非疲劳基础带宽对齐疲劳最大核心宽度，只保留疲劳的局部宽度变化。

**Tech Stack:** 浏览器 Canvas 2D、离屏 canvas、现有 Node 预计算 heat cells、现有前端校验脚本。

---

### Task 1: 写失败校验，锁定共同显示链和高清 surface

**Files:**
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_shared_surface_pipeline.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_screen_space_raster.js`

**Step 1: Write the failing test**

- 校验非疲劳 raster 使用 `devicePixelRatio` 级别的离屏 surface
- 校验 reveal mask 同样走高分辨率 surface
- 校验 `renderHeatmap()` 通过共同 helper 呈现 raster surface 与 vitality surface

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_heatmap_shared_surface_pipeline.js`
Expected: FAIL

**Step 3: Write minimal implementation**

- 在 `src/app.js` 新增 surface scale/helper，并让 heat raster / reveal mask / vitality surface 共用它

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_heatmap_shared_surface_pipeline.js`
Expected: PASS

### Task 2: 对齐非疲劳基础带宽到疲劳最大宽度

**Files:**
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_shared_band_width.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Write the failing test**

- 校验非疲劳核半径计算引用疲劳最大 ribbon 宽度
- 校验 trace reveal radius 使用统一的热带基础宽度，而不是 vitality 单独更宽

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_heatmap_shared_band_width.js`
Expected: FAIL

**Step 3: Write minimal implementation**

- 抽出共享热带宽度 helper
- 非疲劳 heat field 用共享宽度生成固定带宽 surface

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_heatmap_shared_band_width.js`
Expected: PASS

### Task 3: 回归现有热力图校验与语法检查

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Run targeted checks**

Run:
- `node --check src/app.js`
- `node scripts/validate_heatmap_shared_surface_pipeline.js`
- `node scripts/validate_heatmap_shared_band_width.js`
- `node scripts/validate_heatmap_screen_space_raster.js`
- `node scripts/validate_heatmap_non_vitality_direct_pass.js`
- `node scripts/validate_heatmap_uniform_visual_pass.js`
- `node scripts/validate_heatmap_final_edge_smoothing.js`
- `node scripts/validate_heatmap_soft_edge_render.js`
- `node scripts/validate_heatmap_visual_strength.js`
- `node scripts/validate_heatmap_smooth_strong_balance.js`

Expected: PASS

**Step 2: Run supporting checks**

Run:
- `node scripts/validate_heatmap_precomputed_cell_metrics.js`
- `node scripts/validate_heatmap_playback_burden_annotation.js`
- `node scripts/validate_heatmap_progressive_reveal_mode.js`
- `node scripts/validate_heatmap_final_button_full_reveal.js`

Expected: PASS
