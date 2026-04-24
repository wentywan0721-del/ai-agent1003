# Background Crowd Rewrite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rewrite the background-crowd pipeline so ordinary nodes no longer show fake queues, background dots keep a true crowd level and stable black styling, and platform/elevator queue behavior remains intact.

**Architecture:** Keep the existing business rules and heatmap formula, but replace the background pipeline internals with a cleaner lifecycle: balanced route assignment, non-collapsing initial placement, explicit queue-only facilities, and one shared playback/render contract for all views. Rendering remains WebGL-first, but its sampled inputs and style policy become deterministic and crowd-count-stable.

**Tech Stack:** Vanilla JS, Canvas/WebGL, Node-based regression scripts, local simulation core in `src/core.js`, front-end playback in `src/app.js`, server cache versioning in `server/heatmap-runner.js`.

---

### Task 1: Lock the Rewrite Rules Into Regression Tests

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_true_count.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_render_style_constant.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_only_explicit_queue_nodes.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_initial_progress_distribution.js`

**Step 1: Write the failing tests**

- Add coverage that background render style does not fade as crowd count increases.
- Add coverage that only explicit queue nodes can keep queue states in playback.
- Extend true-count validation to larger crowd sizes that matter to the user.

**Step 2: Run tests to verify they fail**

Run:
- `node .\scripts\validate_background_render_style_constant.js`
- `node .\scripts\validate_background_only_explicit_queue_nodes.js`

Expected:
- current implementation fails at least the style test and likely exposes queue-state leakage assumptions if present.

**Step 3: Keep these scripts as fixed acceptance gates**

- Do not weaken assertions after implementation.

### Task 2: Rewrite Spawn Distribution and Population Seeding

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_initial_progress_distribution.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_true_count.js`

**Step 1: Verify the red test**

Run:
- `node .\scripts\validate_background_initial_progress_distribution.js`

Expected:
- PASS already for the clamp fix, and preserve that behavior during the rewrite.

**Step 2: Replace seeding internals without changing route rules**

- Keep route-family weights and balancing.
- Rebuild initial placement so route occupants are distributed across legal route interiors instead of collapsing near buffers.
- Ensure initial active background count equals requested count minus one focus agent.

**Step 3: Run tests**

Run:
- `node .\scripts\validate_background_initial_progress_distribution.js`
- `node .\scripts\validate_background_true_count.js`

Expected:
- both pass.

### Task 3: Rewrite Background Lifecycle and Facility Queue Logic

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_service_rules.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_nonqueue_terminal_no_linger.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_only_explicit_queue_nodes.js`

**Step 1: Keep only explicit queue facilities**

- Ordinary nodes must finish immediately.
- Platform and elevator nodes may queue and serve.

**Step 2: Preserve service-window rules**

- Platform: 180-second headway, one boarding per second.
- Elevator: batch size 13, reopen in 40 seconds, one boarding per second.

**Step 3: Ensure completion immediately replenishes flow**

- Ordinary completions spawn the next valid rider.
- Explicit queue facilities still replenish moving-field population correctly.

**Step 4: Run tests**

Run:
- `node .\scripts\validate_background_queue_service_rules.js`
- `node .\scripts\validate_background_nonqueue_terminal_no_linger.js`
- `node .\scripts\validate_background_only_explicit_queue_nodes.js`

Expected:
- all pass.

### Task 4: Rewrite Playback Sampling Contract

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\server\heatmap-runner.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_nonqueue_node_shell_repulsion.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_playback_curve_interpolation.js`

**Step 1: Remove ordinary-node display hacks from playback export**

- No fake queue rings.
- No ordinary-node linger shells.

**Step 2: Keep one shared sampled playback path for all UI views**

- Main map and Section 04 detail should read the same sampled active background positions.

**Step 3: Bump cache version**

- Update background engine version so the browser/server cannot reuse stale field artifacts.

**Step 4: Run tests**

Run:
- `node .\scripts\validate_background_nonqueue_node_shell_repulsion.js`
- `node .\scripts\validate_background_playback_curve_interpolation.js`

Expected:
- pass with the new field version.

### Task 5: Fix Visual Style and True Rendered Count

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_render_style_constant.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_webgl_renderer.js`

**Step 1: Make background dots visually constant**

- fill stays black
- alpha does not scale down with crowd count
- 700 and 1500 should not differ by unintended fading

**Step 2: Ensure rendered count matches sampled active count**

- No silent count throttling in the renderer.

**Step 3: Run tests**

Run:
- `node .\scripts\validate_background_render_style_constant.js`
- `node .\scripts\validate_background_webgl_renderer.js`

Expected:
- pass.

### Task 6: Manual Verification and Final Regression Sweep

**Files:**
- Modify if needed: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\capture_visualization_detail_layers.js`

**Step 1: Run regression sweep**

Run:
- `node .\scripts\validate_background_true_count.js`
- `node .\scripts\validate_background_initial_progress_distribution.js`
- `node .\scripts\validate_background_only_explicit_queue_nodes.js`
- `node .\scripts\validate_background_queue_service_rules.js`
- `node .\scripts\validate_background_nonqueue_terminal_no_linger.js`
- `node .\scripts\validate_background_nonqueue_node_shell_repulsion.js`
- `node .\scripts\validate_background_render_style_constant.js`

**Step 2: Restart local sim service**

Run:
- restart `server/sim-server.js`
- confirm `http://127.0.0.1:8891/api/health`

**Step 3: Real page checks**

Manually verify in the actual UI:
- 700 people
- 1500 people
- Section 04 large heatmap view
- ordinary nodes do not show fake queues
- background dots remain black
- platform/elevator still queue visibly

**Step 4: Summarize remaining risk**

- If 3000 remains too expensive visually, document that as a renderer scalability question rather than a logic bug.
