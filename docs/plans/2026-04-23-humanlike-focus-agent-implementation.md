# Humanlike Focus Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the focus agent move with human-like elderly walking behavior and render a dense timeline-style thought chain in Section04.

**Architecture:** Expand the existing single-pass LLM decision payload into a richer human-walking intent package, then convert that package into intermediate anchors and stronger movement biases inside the current rule engine. Preserve the existing safety, walkable-area, queue, and heatmap systems while changing how the focus route is shaped and narrated.

**Tech Stack:** Vanilla JS frontend, Node local simulation server, cached heatmap runner, existing `src/core.js` movement engine, Section04 HTML/CSS rendering.

---

### Task 1: Lock down the richer LLM output contract

**Files:**
- Modify: `server/llm-decision-plan.js`
- Create: `scripts/validate_llm_humanlike_plan_schema.js`

**Step 1: Write the failing test**

Create a validation script that asserts `server/llm-decision-plan.js` supports:
- `analysisKind: 'decision-plan'`
- route-style fields for stronger motion shaping
- intermediate anchor output
- micro-thought timeline entries

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_llm_humanlike_plan_schema.js`
Expected: FAIL because anchors / timeline fields are missing.

**Step 3: Write minimal implementation**

Update `server/llm-decision-plan.js` so the prompt, parser, and normalizer support a richer payload, for example:
- `route_style`
- `anchors`
- `timeline`
- `decisions`

Keep backward compatibility for older provider outputs.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_llm_humanlike_plan_schema.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/llm-decision-plan.js scripts/validate_llm_humanlike_plan_schema.js
git commit -m "feat: expand llm walking intent schema"
```

### Task 2: Make analysis input include human-like motion context

**Files:**
- Modify: `server/heatmap-runner.js`
- Modify: `src/core.js`
- Create: `scripts/validate_llm_humanlike_plan_input.js`

**Step 1: Write the failing test**

Create a script that checks the LLM input builder includes:
- base route context
- pressure-aware context
- corridor / openness hints where available
- enough detail for direct routes to still produce anchor points and timeline items

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_llm_humanlike_plan_input.js`
Expected: FAIL because current input is too node-centric.

**Step 3: Write minimal implementation**

Update `buildDecisionPlanInput()` and any required helpers to include:
- direct-route context
- sampled route segments
- nearby pressure summaries
- crowd / noise / wall-following hints

Do not add a second LLM call.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_llm_humanlike_plan_input.js`
Expected: PASS

**Step 5: Commit**

```bash
git add server/heatmap-runner.js src/core.js scripts/validate_llm_humanlike_plan_input.js
git commit -m "feat: provide humanlike motion context to llm"
```

### Task 3: Convert LLM intent into intermediate anchors

**Files:**
- Modify: `src/core.js`
- Create: `scripts/validate_focus_anchor_integration.js`

**Step 1: Write the failing test**

Create a script that verifies the focus-agent runtime can consume LLM-generated intermediate anchors even when there are no classic decision nodes.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_focus_anchor_integration.js`
Expected: FAIL because runtime only uses classic node decisions.

**Step 3: Write minimal implementation**

Add runtime support in `src/core.js` for:
- anchor-aware focus route shaping
- intermediate sub-target progression
- retaining rule fallback when anchors are missing or invalid

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_focus_anchor_integration.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core.js scripts/validate_focus_anchor_integration.js
git commit -m "feat: drive focus routing from llm anchors"
```

### Task 4: Humanize movement along the route

**Files:**
- Modify: `src/core.js`
- Create: `scripts/validate_humanlike_motion_biases.js`

**Step 1: Write the failing test**

Create a script that checks for code paths enabling:
- pre-turn smoothing
- reduced wall hugging
- mild wandering / correction
- stronger crowd-pressure avoidance
- non-robotic lateral behavior for the focus agent

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_humanlike_motion_biases.js`
Expected: FAIL because current movement remains mostly line-following.

**Step 3: Write minimal implementation**

Implement the smallest safe change set that:
- smooths focus turning
- adds anticipation before corners
- makes LLM route-style output visibly affect path shape
- preserves stability and collision safety

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_humanlike_motion_biases.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core.js scripts/validate_humanlike_motion_biases.js
git commit -m "feat: humanize focus agent movement"
```

### Task 5: Densify and render the thought chain as a timeline

**Files:**
- Modify: `src/app.js`
- Modify: `styles.css`
- Create: `scripts/validate_section04_thought_timeline.js`

**Step 1: Write the failing test**

Create a script that asserts Section04 renders:
- one sentence per item
- circular markers
- a connecting vertical line
- no fallback to old risk/reason/advice cards

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_section04_thought_timeline.js`
Expected: FAIL because current panel still renders section blocks instead of a timeline.

**Step 3: Write minimal implementation**

Update Section04 markup and CSS to render a vertical timeline-style thought chain using the hydrated LLM output.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_section04_thought_timeline.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app.js styles.css scripts/validate_section04_thought_timeline.js
git commit -m "feat: render section04 thought timeline"
```

### Task 6: Refresh caching and verify full integration

**Files:**
- Modify: `server/heatmap-runner.js`
- Modify: `scripts/validate_llm_decision_plan_integration.js`
- Create: `scripts/validate_humanlike_focus_agent_end_to_end.js`

**Step 1: Write the failing test**

Create an end-to-end validation script that checks:
- richer LLM plan is serialized into playback
- Section04 hydrates immediately from playback
- cache identity changes when the richer plan contract changes

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_humanlike_focus_agent_end_to_end.js`
Expected: FAIL until cache/version wiring is updated.

**Step 3: Write minimal implementation**

Bump the heatmap engine version if required and update any integration checks for the richer plan payload.

**Step 4: Run test to verify it passes**

Run:
- `node scripts/validate_humanlike_focus_agent_end_to_end.js`
- `node scripts/validate_llm_decision_plan_integration.js`
- `node scripts/validate_heatmap_llm_cache_fingerprint.js`

Expected: all PASS

**Step 5: Commit**

```bash
git add server/heatmap-runner.js scripts/validate_llm_decision_plan_integration.js scripts/validate_humanlike_focus_agent_end_to_end.js
git commit -m "chore: refresh humanlike llm playback integration"
```

### Task 7: Final verification

**Files:**
- No new files required unless a small regression script is useful

**Step 1: Run targeted checks**

Run:
- `node --check server/llm-decision-plan.js`
- `node --check server/heatmap-runner.js`
- `node --check src/app.js`
- `node --check src/core.js`

Expected: all PASS

**Step 2: Run regression scripts**

Run:
- `node scripts/validate_llm_humanlike_plan_schema.js`
- `node scripts/validate_llm_humanlike_plan_input.js`
- `node scripts/validate_focus_anchor_integration.js`
- `node scripts/validate_humanlike_motion_biases.js`
- `node scripts/validate_section04_thought_timeline.js`
- `node scripts/validate_humanlike_focus_agent_end_to_end.js`
- `node scripts/validate_section04_decision_chain_only.js`
- `node scripts/validate_llm_focus_motion_integration.js`

Expected: all PASS

**Step 3: Manual check**

Run the local stack and manually verify a long route:
- the trajectory bends and corrects naturally
- direct routes still produce multiple thought entries
- the Section04 panel renders a circular-marker timeline
- no legacy route-analysis fetch reappears

**Step 4: Commit**

```bash
git add .
git commit -m "feat: deliver humanlike llm-guided focus agent"
```
