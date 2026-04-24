# Wheelchair Locomotor Branch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `locomotor = 1` behave as a wheelchair agent: keep strong crowd/space slowdown, but lower fatigue accumulation, damp noise/light fatigue effects, and disable short-rest and seat-rest triggers.

**Architecture:** Keep the existing five-dimension structure and add a narrow wheelchair branch inside `src/core.js`. The branch only affects profile-derived fatigue/rest settings and realtime fatigue accumulation for `locomotor = 1`, while leaving the existing locomotor path-space resistance logic intact.

**Tech Stack:** Plain JavaScript, Node validation scripts, existing simulator core helpers in `src/core.js`

---

### Task 1: Add failing wheelchair-rule validation

**Files:**
- Create: `scripts/validate_wheelchair_locomotor_rules.js`

**Step 1: Write the failing test**
- Assert `buildFocusProfile({ locomotor: 1, vitality: 5 })` keeps vitality independent for the wheelchair branch.
- Assert wheelchair profile disables short rest and seat-rest search.
- Assert wheelchair fatigue base rate is lower than the current best walking baseline.
- Assert wheelchair realtime fatigue reacts only weakly to noise and lighting escalation.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_wheelchair_locomotor_rules.js`

Expected: fail on current profile/fatigue/rest behavior.

### Task 2: Implement wheelchair locomotor branch

**Files:**
- Modify: `src/core.js`

**Step 1: Add wheelchair helpers/constants**
- Add helpers/constants for wheelchair detection, wheelchair fatigue base-rate table, and damping for noise/light fatigue multipliers.

**Step 2: Keep vitality independent for wheelchair branch**
- Update locomotor-vitality normalization so `locomotor = 1` does not clamp vitality down.

**Step 3: Apply wheelchair fatigue/rest profile overrides**
- In profile metric derivation, set wheelchair-only fatigue rate, disable short rest, disable seat-rest search, and keep walking speed unchanged.

**Step 4: Apply wheelchair realtime fatigue damping**
- In realtime fatigue accumulation, keep crowd influence, but compress noise/light effects for wheelchair profiles.

**Step 5: Block wheelchair rest triggers**
- Gate `startRestSearch` and `startShortRest` calls behind the wheelchair rest-disable flags.

### Task 3: Verify and regressions

**Files:**
- Modify if needed: `scripts/validate_locomotor_rules.js`

**Step 1: Run target validations**

Run:
- `node scripts/validate_wheelchair_locomotor_rules.js`
- `node scripts/validate_locomotor_rules.js`
- `node scripts/validate_vitality_rules.js`
- `node --check src/core.js`

**Step 2: Confirm no unrelated UI work is touched**
- Verify only locomotor/fatigue/rest logic changed.
