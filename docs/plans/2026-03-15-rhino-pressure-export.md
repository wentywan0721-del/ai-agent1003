# Rhino Pressure Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Rhino exporter so only simulation-participating pressure points are exported, map the revised Rhino names to the current rule taxonomy, and keep the output compatible with the current frontend prototype.

**Architecture:** Keep the change centered in `scripts/export_rhino_sim.py` by introducing small helpers for pressure normalization, export filtering, and stable pressure IDs. Verify behavior through `scripts/validate_rhino_export_logic.py`, then run the existing scenario validator to confirm downstream compatibility.

**Tech Stack:** Rhino Python 2.7-compatible exporter, Python validation script, Node scenario validator

---

### Task 1: Lock expected export behavior in validation

**Files:**
- Modify: `scripts/validate_rhino_export_logic.py`

**Step 1: Write the failing test**

Add assertions for:
- `Hanging Signs` / `Common direction Signs` / `LCD` / `Panoramic guide map` -> `signage`
- `Customer Service Centre` / `AI virtual service ambassador` -> exported active pressure points
- `Advertisement` with only `1060 lux` -> normalized as dynamic/flashing advertisement behavior
- `Book Drop` / `Newspaper box` / `AED` -> excluded from export
- generated pressure IDs remain stable and unique even when Rhino `id` is absent

**Step 2: Run test to verify it fails**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: FAIL because current exporter does not map the new names or filter excluded points.

**Step 3: Write minimal validation changes**

Import only the helper functions needed from `scripts/export_rhino_sim.py` and keep assertions narrow and explicit.

**Step 4: Run test to verify it still reflects the target behavior**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: still FAIL until exporter is updated.

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 2: Update Rhino pressure classification and export filtering

**Files:**
- Modify: `scripts/export_rhino_sim.py`

**Step 1: Write the failing test**

Use the validation from Task 1 as the failing safety net.

**Step 2: Run test to verify it fails**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: FAIL against the old exporter logic.

**Step 3: Write minimal implementation**

Implement:
- name/feature normalization for revised Rhino pressure objects
- explicit signage and service-facility mapping
- default handling for `Advertisement` + `1060 lux`
- export filtering so only active simulation pressure points are emitted
- stable fallback pressure IDs
- Python 2.7-safe numeric extraction

**Step 4: Run test to verify it passes**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 3: Keep runtime behavior aligned with exported categories

**Files:**
- Modify: `src/core.js`

**Step 1: Write the failing test**

Use the existing scenario validation plus an assertion that active exported service facilities remain visible to the simulation layer.

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_scenarios.js`

Expected: if category handling is incomplete, exporter and runtime assumptions diverge.

**Step 3: Write minimal implementation**

Update the runtime category weight / suggestion handling only if needed so newly exported active categories still contribute to pressure calculations and hotspot suggestions.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 5: Commit**

Skip. This workspace is not a git repository.

### Task 4: Final verification

**Files:**
- Modify: none

**Step 1: Run Python validation**

Run: `python scripts/validate_rhino_export_logic.py`

Expected: PASS

**Step 2: Run JS syntax checks**

Run: `node --check src/core.js`

Expected: PASS

**Step 3: Run scenario validation**

Run: `node scripts/validate_scenarios.js`

Expected: PASS

**Step 4: Summarize residual follow-up**

Document that `gate_*` / `train_door*` naming mismatch is intentionally deferred.

**Step 5: Commit**

Skip. This workspace is not a git repository.
