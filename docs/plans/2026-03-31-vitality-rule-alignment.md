# Vitality Rule Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the vitality and fatigue implementation with the confirmed rule sheet, including scoring constraints, fatigue formula inputs, rest behaviour, and short-rest markers.

**Architecture:** Keep the existing single-page HTML/CSS/JS structure and adjust only the existing vitality pipeline in `src/core.js`, rule config in `data/unified-rules.js`, and the focus-agent overlay in `src/app.js`. Add or update validation scripts first, then make the minimal production changes needed to satisfy them.

**Tech Stack:** Vanilla JavaScript, Node validation scripts, HTML/CSS, existing simulator core.

---

### Task 1: Lock the target vitality rules in failing validations

**Files:**
- Modify: `scripts/validate_vitality_rules.js`
- Modify: `scripts/validate_view_rest_rules.js`
- Create: `scripts/validate_vitality_rest_markers.js`

**Step 1: Write the failing tests**
- Update vitality validation to expect:
  - `normalizeCapacityScores({ locomotor: 5, vitality: 1 })` clamps vitality to `4`
  - locomotor walking speed no longer multiplies vitality speed factors
  - vitality `1` locomotor `5` yields `walkingSpeed = 1.10`
  - fatigue accumulation excludes queue multiplier
- Update rest validation to expect:
  - standing rest requires low density plus wall distance `>= 1m`
  - pause fatigue can keep increasing during non-rest pauses
- Add a marker validation that checks:
  - short-rest trigger records marker metadata
  - marker size scales with trigger fatigue percent

**Step 2: Run tests to verify they fail**

Run:
```powershell
node scripts/validate_vitality_rules.js
node scripts/validate_view_rest_rules.js
node scripts/validate_vitality_rest_markers.js
```

**Step 3: Keep the failures as the change target**

### Task 2: Align the vitality rule config and profile metrics

**Files:**
- Modify: `src/core.js`
- Modify: `data/unified-rules.js`

**Step 1: Update rule constants**
- Restore the locomotor-vitality `±1` clamp.
- Remove vitality walking-speed multipliers from the base walking speed computation.
- Change vitality locomotor fatigue multiplier for score `1` from `1.15` to `1.1`.
- Keep threshold/recovery constants aligned with the rule sheet.

**Step 2: Update fatigue accumulation**
- Remove queue multiplier from real-time `fatigueDelta`.
- Preserve queue cost only in path/facility evaluation logic.
- Apply fatigue growth during decision pauses, but not during short-rest or formal rest states.

**Step 3: Run targeted validations**

Run:
```powershell
node scripts/validate_vitality_rules.js
node --check src/core.js
```

### Task 3: Align standing-rest and seat-search behaviour

**Files:**
- Modify: `src/core.js`
- Modify: `scripts/validate_view_rest_rules.js`

**Step 1: Update standing-rest location logic**
- Require low-density standing rest to satisfy:
  - `crowdDensity < 1`
  - `wallDistance >= 1`
- Allow medium-density standing rest when `crowdDensity <= 3`.
- Keep seat interruption when surrounding density exceeds `3`.

**Step 2: Keep the 36-second abandon-search flow**
- Continue searching for seats until timeout.
- After timeout, switch to standing-rest only when a valid standing band exists.
- Otherwise keep searching while moving slowly.

**Step 3: Run targeted validations**

Run:
```powershell
node scripts/validate_view_rest_rules.js
node --check src/core.js
```

### Task 4: Add short-rest point markers in the vitality view

**Files:**
- Modify: `src/core.js`
- Modify: `src/app.js`
- Modify: `styles.css`
- Test: `scripts/validate_vitality_rest_markers.js`

**Step 1: Record short-rest marker data**
- When a short-rest threshold triggers, append marker payload containing:
  - position
  - trigger fatigue percent
  - derived radius bucket
  - timestamp / lap context if needed

**Step 2: Render markers non-destructively**
- Draw markers only from existing focus playback/state data.
- Keep the confirmed UI structure unchanged.
- Scale marker radius by fatigue percentage.

**Step 3: Run validations**

Run:
```powershell
node scripts/validate_vitality_rest_markers.js
node --check src/app.js
```

### Task 5: Full regression pass

**Files:**
- No code changes expected

**Step 1: Run the full relevant checks**

Run:
```powershell
node scripts/validate_vitality_rules.js
node scripts/validate_view_rest_rules.js
node scripts/validate_vitality_rest_markers.js
node scripts/validate_scenarios.js
node --check src/core.js
node --check src/app.js
```

**Step 2: Summarize any remaining mismatch**
- If a rule still differs from code, report it explicitly with file references.
