# Left Shell And Rule Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the left panel’s inner shell look and align the simulation core with the approved fatigue, stress, facility, and rest rules.

**Architecture:** Keep the current single-page frontend structure, simplify the left-panel visual treatment in `index.html` and `styles.css`, and expand the rule engine inside `src/core.js` using the approved spreadsheets and explanation document as the source of truth. Reuse `scripts/validate_scenarios.js` as the regression harness.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Node.js validation script

---

### Task 1: Add failing validations

**Files:**
- Modify: `scripts/validate_scenarios.js`

**Steps:**
1. Add assertions that left-panel route and agent summaries no longer use the inner glass-card shell classes.
2. Add synthetic rule assertions for:
   - signage/advertisement expected stress outcomes
   - ambient noise/light environment accumulation
   - queue fatigue coefficients and rest thresholds
   - facility path-cost helpers
3. Run `node scripts/validate_scenarios.js` and confirm failure.

### Task 2: Remove left-panel inner shells

**Files:**
- Modify: `index.html`
- Modify: `styles.css`
- Modify: `src/app.js`

**Steps:**
1. Replace left-panel summary card wrappers with plain summary rows.
2. Add dedicated lightweight styles for left-panel summaries.
3. Keep right-panel cards unchanged.
4. Run `node --check src/app.js`.

### Task 3: Align fatigue and stress coefficients

**Files:**
- Modify: `src/core.js`

**Steps:**
1. Expand fatigue environment coefficient helpers from the approved tables.
2. Expand stress event descriptors and stress multipliers from the approved tables.
3. Normalize current pressure-point metadata to the new descriptors.
4. Run `node --check src/core.js`.

### Task 4: Align facility cost and rest logic

**Files:**
- Modify: `src/core.js`

**Steps:**
1. Update path-cost logic to match walk/wait/ride formulas and threshold screening.
2. Align facility accumulation velocities and wait-time assumptions.
3. Align rest search, give-up timing, open-area fallback, and recovery rules.
4. Re-run `node --check src/core.js`.

### Task 5: Verify end to end

**Files:**
- Modify: `scripts/validate_scenarios.js` (if minor assertion updates are required)

**Steps:**
1. Run `node --check src/app.js`
2. Run `node --check src/core.js`
3. Run `node --check scripts/validate_scenarios.js`
4. Run `node scripts/validate_scenarios.js`
5. Summarize which document rules are now implemented and which are intentionally deferred.

