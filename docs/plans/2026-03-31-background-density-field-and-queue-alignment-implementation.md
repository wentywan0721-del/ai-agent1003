# Background Density Field And Queue Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework background crowd simulation so it provides a reusable `Density(x,y,t)` field and queue state for the focus agent, while also aligning escalator timing, elevator share, train-door balance, and queue visuals with the confirmed rules.

**Architecture:** Keep the current local Node heatmap service and existing UI, but change the background layer from "focus-like per-agent stepping for density lookup" into a lighter background-field pipeline. The background system will still render moving dots and queue states, but it will also emit time-sliced density data that the focus agent reads directly when evaluating five-dimension burdens. Queue rules and route selection weights are adjusted locally inside the existing background simulation pipeline, not through a UI rewrite.

**Tech Stack:** Vanilla JS frontend, local Node sim server, shared simulation core in `src/core.js`, validation scripts in `scripts/`.

---

### Task 1: Lock the new background requirements with failing tests

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_service_rules.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_layout.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_density_field.js`
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_focus_reads_background_density.js`

**Step 1: Write the failing test for escalator boarding and queue timing**

Add assertions that escalator boarding display time is about 1 second instead of 2 seconds, and that escalator expected wait time scales with 1 second per boarding slot.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_queue_service_rules.js`

Expected: FAIL on the escalator timing assertion because the current code still uses `ESCALATOR_BOARDING_SECONDS = 2`.

**Step 3: Write the failing test for queue layout**

Change the layout test so it no longer expects a strict three-column formation. Instead, assert that queued passengers near a facility occupy multiple nearby points inside a compact congestion patch and are not locked into identical row depths.

**Step 4: Run test to verify it fails**

Run: `node scripts/validate_background_queue_layout.js`

Expected: FAIL because the current queue pose code is still based on `BACKGROUND_QUEUE_COLUMNS = 3`.

**Step 5: Write the failing test for density field generation**

Create `scripts/validate_background_density_field.js` that:
- builds a background field,
- asserts the result contains a time-sliced density structure,
- asserts density can be queried by time and point,
- asserts queue zones contribute to local density.

**Step 6: Run test to verify it fails**

Run: `node scripts/validate_background_density_field.js`

Expected: FAIL because the current background field result only stores frames and agent snapshots, not a reusable density field API/data structure.

**Step 7: Write the failing test for focus-agent density lookup**

Create `scripts/validate_focus_reads_background_density.js` that:
- creates a scenario with a background field,
- evaluates local pressure for the focus agent,
- asserts crowd density comes from the background density field when available instead of iterating every background agent directly.

**Step 8: Run test to verify it fails**

Run: `node scripts/validate_focus_reads_background_density.js`

Expected: FAIL because `computeCrowdDensity()` and `computePerceptionCrowdDensity()` still iterate `scenario.agents`.

**Step 9: Commit**

```bash
git add scripts/validate_background_queue_service_rules.js scripts/validate_background_queue_layout.js scripts/validate_background_density_field.js scripts/validate_focus_reads_background_density.js
git commit -m "test: lock background density and queue alignment requirements"
```

### Task 2: Emit reusable `Density(x,y,t)` data from the background field

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:6942-7117`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\server\heatmap-runner.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\server\heatmap-cache.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_density_field.js`

**Step 1: Write the minimal background density data model**

Add a serialized structure inside the background field result that stores:
- `densityFrames`
- `queueFrames`
- grid cell indices or sampled walkable cells
- time step metadata needed for lookup

Do not remove existing background agent frames yet, because the UI still needs moving dots.

**Step 2: Implement density accumulation during background precompute**

Inside `precomputeBackgroundField()` and `precomputeBackgroundFieldAsync()`:
- keep current frame capture,
- additionally accumulate density values into a compact time-sliced field,
- add queue occupancy contributions around explicit queue nodes.

**Step 3: Keep the cache key/version honest**

Bump background field versioning so old cache files are not silently reused against the new density format.

**Step 4: Run density-field test to verify it passes**

Run: `node scripts/validate_background_density_field.js`

Expected: PASS

**Step 5: Run cache reuse verification**

Run: `node scripts/validate_background_field_cache_reuse.js`

Expected: PASS

**Step 6: Commit**

```bash
git add src/core.js server/heatmap-runner.js server/heatmap-cache.js scripts/validate_background_density_field.js
git commit -m "feat: emit reusable background density field"
```

### Task 3: Make the focus agent read background density instead of scanning all background agents

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:5068-5097`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:5414-5418`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_focus_reads_background_density.js`
- Regression: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_scenarios.js`

**Step 1: Add density lookup helpers**

Implement helpers such as:
- `sampleBackgroundDensityField(backgroundField, point, time, mode)`
- `getScenarioCrowdDensityAtPoint(scenario, point, selfAgent, mode)`

The helpers should:
- use background density frames when available,
- fall back to live agent iteration only when no background field exists.

**Step 2: Wire lookup into pressure evaluation**

Update local environment evaluation so the focus agent’s:
- `crowdDensityLocal`
- `crowdDensityPerception`

read from the background field during precomputed playback and local-service playback.

**Step 3: Run focus density test to verify it passes**

Run: `node scripts/validate_focus_reads_background_density.js`

Expected: PASS

**Step 4: Run scenario regression**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core.js scripts/validate_focus_reads_background_density.js
git commit -m "feat: read crowd density from background field"
```

### Task 4: Align background queue service rules and visual layout

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:245-257`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:4255-4344`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_service_rules.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_queue_layout.js`

**Step 1: Update escalator boarding timing**

Change escalator boarding seconds from 2 to 1, and keep related wait-time estimation consistent.

**Step 2: Replace rigid three-column queue placement**

Remove the fixed `BACKGROUND_QUEUE_COLUMNS = 3` geometry from queue pose generation.

Replace it with a compact random congestion patch:
- anchored near the facility mouth,
- stable per agent and queue slot,
- projected back to walkable space,
- still preserving front/back order for service logic.

**Step 3: Preserve queue semantics**

Do not change:
- who is first,
- who boards next,
- elevator batch size 13,
- elevator reopen 40 seconds,
- platform train headway 180 seconds,
- stair boarding 1 second.

Only change display/placement and escalator boarding speed.

**Step 4: Run queue rule tests**

Run:
- `node scripts/validate_background_queue_service_rules.js`
- `node scripts/validate_background_queue_layout.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core.js scripts/validate_background_queue_service_rules.js scripts/validate_background_queue_layout.js
git commit -m "feat: align queue timing and congestion layout"
```

### Task 5: Reduce elevator share and keep five train waiting points roughly balanced over time

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js:3970-4045`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js` in the background route selection helpers near the OD/end-point selection logic
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_background_distribution_balance.js`

**Step 1: Write the failing distribution test**

Create a test that samples a large number of background route choices and asserts:
- elevator endpoints are chosen less often than before,
- the five train-door endpoints remain roughly balanced over long runs,
- balance allows randomness and is not a forced exact 1:1:1:1:1 split.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_distribution_balance.js`

Expected: FAIL against the current equal-weight endpoint collection.

**Step 3: Add endpoint weight controls**

Adjust endpoint collection or route selection so:
- elevator endpoints use lower weights,
- train doors use equal base weights,
- a soft balancing term nudges repeated picks toward underused doors over time.

Keep the correction small enough that the result still looks random.

**Step 4: Run distribution test to verify it passes**

Run: `node scripts/validate_background_distribution_balance.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core.js scripts/validate_background_distribution_balance.js
git commit -m "feat: rebalance elevator share and train-door distribution"
```

### Task 6: Verify end-to-end heatmap playback still works with the new background field

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_local_playback_runtime_heat.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_server_cache.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_heatmap_server_client_bridge.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_local_heatmap_time_budget.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_scenarios.js`

**Step 1: Run runtime playback regression**

Run: `node scripts/validate_local_playback_runtime_heat.js`

Expected: PASS

**Step 2: Run local heatmap server regressions**

Run:
- `node scripts/validate_heatmap_server_cache.js`
- `node scripts/validate_heatmap_server_client_bridge.js`
- `node scripts/validate_local_heatmap_time_budget.js`

Expected: PASS

**Step 3: Run broader scenario regression**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 4: Commit**

```bash
git add src/core.js server/heatmap-runner.js server/heatmap-cache.js scripts/validate_local_playback_runtime_heat.js scripts/validate_heatmap_server_cache.js scripts/validate_heatmap_server_client_bridge.js scripts/validate_local_heatmap_time_budget.js scripts/validate_scenarios.js
git commit -m "test: verify background density field integration"
```

