# Platform Queue Shape Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the rigid rear queue layout with irregular outward congestion at platform doors and the elevator, while reducing elevator background route share.

**Architecture:** Keep the existing background queue lifecycle intact and only swap the pose-generation rule for waiting passengers. Platform queues will use a wider linked half-ellipse, while elevator queues will use a tighter half-ellipse. Distribution weighting stays in the existing route selection function.

**Tech Stack:** Plain JavaScript, Node validation scripts, existing simulation core in `src/core.js`

---

### Task 1: Lock the expected behavior in tests

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_layout.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_distribution_balance.js`

**Step 1: Write the failing test**

- Replace the old “backward queue” assertions with checks that queued platform passengers:
  - stay above the platform door line,
  - form horizontal spread large enough to connect neighboring doors,
  - keep a visible local concentration around each door.
- Tighten the elevator share threshold in the distribution validation.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_queue_layout.js`
Expected: FAIL because the current queue layout is still back-row based

Run: `node scripts/validate_background_distribution_balance.js`
Expected: FAIL because the current elevator weighting is still too high for the new threshold

### Task 2: Implement the minimal queue placement change

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js`

**Step 1: Write minimal implementation**

- Branch queue placement by facility mode inside `setBackgroundAgentQueuePose(...)`.
- For `platform`, compute an outward half-ellipse with growing lateral reach so adjacent doors visually connect.
- For `elevator`, compute a smaller outward half-ellipse with less lateral reach.
- Leave boarding state, queue order, and replenishment logic untouched.
- Reduce `BACKGROUND_ELEVATOR_ROUTE_WEIGHT_FACTOR` by half.

**Step 2: Run tests to verify it passes**

Run:
- `node scripts/validate_background_queue_layout.js`
- `node scripts/validate_background_distribution_balance.js`

Expected: PASS

### Task 3: Regression check

**Files:**
- No code changes expected

**Step 1: Run focused validations**

Run:
- `node --check src/core.js`
- `node scripts/validate_background_queue_replenish.js`
- `node scripts/validate_background_queue_service_rules.js`
- `node scripts/validate_background_queue_states.js`
- `node scripts/validate_background_render_visibility.js`

**Step 2: Summarize outcome**

- Report the visual logic change, the lowered elevator weight, and any remaining tuning knobs if the crowd still looks too narrow or too regular.
