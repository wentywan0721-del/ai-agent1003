# LLM Decision Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate a single cached LLM call into the "Start Analysis" flow so the focus agent can use high-level decision guidance and Section 04 can render a chronological decision chain from the same result.

**Architecture:** Keep low-level locomotion, queueing, collision, and heatmap rules unchanged. Generate one structured "decision plan" per analysis request, cache it locally with stable inputs, apply the plan during focus-agent route resolution with safe rule fallback, and expose the same plan to the UI/report layer.

**Tech Stack:** Browser JavaScript, Node local sim server, existing OpenAI-compatible provider layer, local JSON cache under `.cache`

---

### Task 1: Add regression guard for the new shared LLM flow

**Files:**
- Create: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_llm_decision_plan_integration.js`
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_llm_decision_plan_integration.js`

**Step 1: Write the failing test**

Add a validation script that expects:
- `server/heatmap-runner.js` to include decision-plan metadata in the serialized playback result
- `src/core.js` to expose a focus decision-plan builder / applier path
- `src/app.js` to stop rendering the old Section 04 manual LLM button

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_llm_decision_plan_integration.js`
Expected: FAIL because the new LLM plan path is not wired yet

**Step 3: Write minimal implementation**

Implement the smallest set of server/core/app changes needed to satisfy the assertions while preserving rule fallback.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_llm_decision_plan_integration.js`
Expected: PASS

### Task 2: Add server-side single-call LLM decision plan generation and cache

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\server\sim-server.js`
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\server\heatmap-runner.js`

**Step 1: Build a stable decision-plan cache key**

Use route, target, five-dimension scores, crowd parameters, rules version, and prompt/model version to generate a stable cache input.

**Step 2: Add a structured LLM decision-plan request helper**

Reuse the existing OpenAI-compatible provider configuration and request logic. The helper should return:
- bilingual summary
- ordered decision entries
- route style preferences
- per-node target overrides when valid

**Step 3: Add safe fallback behavior**

If no key, timeout, malformed output, or invalid node ids:
- mark provider unavailable/error
- keep the decision plan empty or advisory only
- allow the rule engine to run unchanged

**Step 4: Attach the result to heatmap playback serialization**

Return the decision plan in the heatmap result so the front end and report can reuse it without another request.

### Task 3: Apply the plan inside focus-agent route resolution

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\core.js`

**Step 1: Build structured decision-node candidates**

Create a helper that gathers:
- current decision node
- target region
- current target node
- evaluated candidates
- LLM decision context

**Step 2: Allow scenario-level decision guidance**

Store the LLM plan on the scenario and let focus-route resolution prefer the LLM-selected node only when:
- the node belongs to the valid candidate set
- the node is allowed by facility constraints

**Step 3: Preserve rule fallback**

If the LLM plan is absent or invalid, keep current `resolveFocusRoute(...)` behavior.

### Task 4: Rewire Section 04 / report to reuse the same result

**Files:**
- Modify: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\src\app.js`

**Step 1: Hydrate route-analysis state from heatmap playback metadata**

When heatmap playback is returned, copy the serialized decision plan into `state.routeAnalysis`.

**Step 2: Remove the old Section 04 manual trigger**

Delete the manual button and click binding from the detail COT panel.

**Step 3: Render a chronological decision chain**

Render entries in this order:
- `Decision XX`
- `Reason`
- `Context`

Support locale switching from the same payload.

**Step 4: Keep report reuse**

The report modal should reuse `state.routeAnalysis.result` and only fall back to a server request if absolutely necessary.

### Task 5: Verify the integration

**Files:**
- Test: `E:\courses\S4\MUDT1003设计\新建文件夹\codex\scripts\validate_llm_decision_plan_integration.js`
- Test: existing relevant scripts under `scripts/`

**Step 1: Run the new regression script**

Run: `node scripts/validate_llm_decision_plan_integration.js`

**Step 2: Run existing related scripts**

Run:
- `node scripts/validate_route_analysis_service.js`
- `node scripts/validate_llm_analysis_localization.js`
- `node scripts/validate_report_analysis_foundation.js`

**Step 3: Manually confirm expected UI contract**

Check that:
- `开始分析` is the only LLM trigger
- Section 04 no longer shows the old extra LLM button
- the right panel shows chronological decision entries from the shared result
