# Psychological Rule Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining psychological burden rule gaps without redesigning the confirmed UI.

**Architecture:** Keep the existing simulation pipeline and patch the psychological rule chain in `src/core.js`. Add deterministic regression checks in `scripts/validate_psychological_rules.js`, then update the pressure engine so psychological burden uses the full `Vp`, first-sight trigger memory, lighting stress, and queue stress sourced from background crowd near facility entrances.

**Tech Stack:** Vanilla JS, Node validation scripts, existing simulation engine in `src/core.js`

---

### Task 1: Lock the target behavior in regression checks

**Files:**
- Modify: `scripts/validate_psychological_rules.js`

**Step 1: Write the failing test**

Extend the script to assert:
- psychological `Vp` uses sensory/cognitive/locomotor/vitality modifiers
- signage/advertisement pressure triggers once on first sight
- lighting contributes to psychological pressure
- queue pressure contributes separately from crowd density

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_psychological_rules.js`
Expected: FAIL on current missing psychological rule pieces.

**Step 3: Write minimal implementation**

No implementation in this task.

**Step 4: Run test to verify it still fails for the intended reason**

Run: `node scripts/validate_psychological_rules.js`
Expected: FAIL on the missing rule behavior, not on syntax.

### Task 2: Implement full psychological vulnerability and stress environment chain

**Files:**
- Modify: `data/unified-rules.js`
- Modify: `src/core.js`

**Step 1: Write the failing test**

Use `scripts/validate_psychological_rules.js`.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_psychological_rules.js`
Expected: FAIL before code changes.

**Step 3: Write minimal implementation**

Implement:
- `crossModifiers.psychological`
- full psychological composite vulnerability helper
- shared psychological burden formula helper
- lighting stress contribution and lighting multiplier in the stress chain
- queue stress contribution helper and returned fields

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_psychological_rules.js`
Expected: PASS

### Task 3: Convert visual pressure sources to one-shot trigger events

**Files:**
- Modify: `src/core.js`

**Step 1: Write the failing test**

Use the advertisement/signage assertions in `scripts/validate_psychological_rules.js`.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_psychological_rules.js`
Expected: FAIL if the same visible object retriggers continuously.

**Step 3: Write minimal implementation**

Update stress rule descriptors and event handling so signage, ads, and broadcast-like pressure sources trigger once on first entry into view and reuse stored memory while visible.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_psychological_rules.js`
Expected: PASS

### Task 4: Verify the simulator still runs cleanly

**Files:**
- Verify only

**Step 1: Run focused validations**

Run:
- `node scripts/validate_psychological_rules.js`
- `node scripts/validate_heat_field.js`
- `node --check src/core.js`
- `node --check src/app.js`
- `node scripts/validate_scenarios.js`

**Step 2: Confirm outputs**

Expected:
- all commands exit `0`
- no syntax errors
- no scenario regression
