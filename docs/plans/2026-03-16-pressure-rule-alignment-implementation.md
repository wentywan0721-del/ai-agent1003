# Pressure Rule Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align cognitive-load calculation more closely with the approved rules by separating persistent consultation events from position-dependent visible stressors and keeping the behavior executable through the existing validator.

**Architecture:** Keep all rule evaluation in `src/core.js`. Expose a small public helper for pressure-state inspection so `scripts/validate_scenarios.js` can lock the rule semantics with a synthetic scenario. Preserve the existing frontend contract by continuing to surface `pressure` / `cognitiveLoad` through the current agent inspection APIs.

**Tech Stack:** Plain JavaScript, existing simulation runtime in `src/core.js`, Node-based executable validation in `scripts/validate_scenarios.js`.

---

### Task 1: Lock local-vs-persistent pressure semantics

**Files:**
- Modify: `scripts/validate_scenarios.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Add validator assertions for:
- exported pressure-state evaluation helper
- dynamic advertisement contributing deterministic local cognitive load while visible
- customer service interaction producing persistent stress after the local visual stimulus is left behind

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: FAIL because the runtime does not yet expose the helper or the revised pressure split.

**Step 3: Write minimal implementation**

Implement in `src/core.js`:
- rule effect modes (`persistent-event`, `visible-expected`, `ambient`)
- expected-net local visible stress evaluation
- persistent consultation event accumulation
- exported `evaluatePressureStateAtPoint()` helper

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS for the synthetic pressure semantics and existing regression coverage.

**Step 5: Commit**

Skip. This workspace is not a git repository.
