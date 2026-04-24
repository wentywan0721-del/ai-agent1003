# Rest Visibility And Timeline Order Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make low-vitality seat-seeking obey the approved visibility rules and keep Section04 decision-chain highlighting aligned with the real playback order.

**Architecture:** Keep the existing focus-agent route and rendering systems intact. Add a narrow visibility-arbitration layer inside the rest state machine so seat-search only starts when the seat/target visibility rules allow it, and cancel seat-search immediately when the target becomes visible again. Separately, tighten the LLM/runtime event node mapping and Section04 active-order logic so the decision timeline follows real playback order instead of drifting to the selected target fallback.

**Tech Stack:** Vanilla JS simulation core, Node validation scripts, browser-side app state/render logic.

---

### Task 1: Lock The Seat/Target Visibility Rules With Failing Tests

**Files:**
- Create: `scripts/validate_focus_rest_visibility_priority.js`

**Steps:**
1. Write a failing test for `85%` fatigue where both seat and target are visible, and assert the focus agent keeps moving toward the target instead of entering seat-search.
2. Write a failing test for `85%` fatigue where the target is not visible but a seat is visible, and assert the focus agent enters seat-search.
3. Write a failing test where the focus agent has already started seat-search, then the target becomes visible, and assert the agent abandons seat-search and resumes the target route.
4. Run the new script and confirm it fails before implementation.

### Task 2: Lock The Runtime Event / Timeline Order Regression

**Files:**
- Modify: `scripts/validate_llm_runtime_event_grounding.js`
- Create: `scripts/validate_section04_runtime_timeline_active_order.js`

**Steps:**
1. Extend the runtime-event grounding test so seat-search / sitting events cannot reuse the plain selected target node id when there is no actual decision node.
2. Add a UI logic test that evaluates `getVisualizationDetailTimelineActiveOrder(...)` and proves a long rest/search playback advances by real playback time/order instead of getting stuck on a mid-route progress sample.
3. Run both scripts and confirm they fail before implementation.

### Task 3: Implement Rest Visibility Arbitration

**Files:**
- Modify: `src/core.js`

**Steps:**
1. Add helper logic to determine whether the current target node is within the focus agent’s perception radius.
2. Change the `85%` seat-search trigger so it only starts when a seat is visible and the target is not visible.
3. When the target is visible, keep the focus agent on the main target route even if fatigue is already past `85%`.
4. While seat-search is in progress, immediately cancel seat-search and return to the target route if the target becomes visible again before the seat is reached.
5. Preserve existing trace / heat deposition so the detour to a seat, sitting pause, and return to the route remain part of the focus playback path.

### Task 4: Fix LLM Runtime Node Mapping And Section04 Highlight Order

**Files:**
- Modify: `server/heatmap-runner.js`
- Modify: `src/app.js`

**Steps:**
1. Make runtime event node ids prefer actual decision nodes when present, but otherwise fall back to progress/time samples instead of blindly using the selected target node id.
2. Update Section04 active-order logic so long rest/search phases can continue advancing through the timeline using playback time/order instead of freezing on one progress bucket.
3. Keep the existing selected-target fallback only as the last resort.

### Task 5: Verify And Regressions

**Files:**
- Modify if needed: `scripts/validate_view_rest_rules.js`

**Steps:**
1. Run the new tests and confirm they pass.
2. Re-run the existing rest / playback / LLM / Section04 validation scripts that cover this area.
3. If any expectation changed because the new rule is intentionally stricter, update only the affected tests.
