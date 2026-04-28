# Background Field Bucket Prewarm Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reuse long-running background crowd field computation by bucketing crowd counts into fixed cache tiers and prewarming those tiers on sim-server startup.

**Architecture:** Keep the existing split between background-field computation and focus-agent heat playback. Add a bucket resolver for background-field fingerprints so focus requests can reuse the nearest prewarmed background field, then add a server-side startup prewarm loop for the fixed `500/1000/1500/2000` tiers. Frontend should remain unchanged because it already consumes server-produced playback artifacts.

**Tech Stack:** Node.js, existing `server/heatmap-runner.js` + `server/sim-server.js`, validation scripts under `scripts/`

---

### Task 1: Add regression coverage for bucketed background-field cache reuse

**Files:**
- Create: `scripts/validate_background_field_bucketed_cache.js`
- Modify: `server/heatmap-runner.js`

**Step 1: Write the failing test**

Create a validation script that:
- builds two requests with different focus settings
- uses nearby background crowd counts that should resolve to the same bucket
- asserts the produced `backgroundCacheKey` matches
- asserts the second request reuses the cached background field

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_field_bucketed_cache.js`
Expected: FAIL before the bucket logic exists.

**Step 3: Write minimal implementation**

Add bucket-resolution helpers in `server/heatmap-runner.js` and use the resolved bucket crowd count in the background-field fingerprint only.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_background_field_bucketed_cache.js`
Expected: PASS.

### Task 2: Add regression coverage for startup prewarm configuration

**Files:**
- Create: `scripts/validate_background_field_prewarm_config.js`
- Modify: `server/sim-server.js`

**Step 1: Write the failing test**

Create a validation script that:
- imports sim-server helpers
- asserts the configured prewarm buckets are exactly `500/1000/1500/2000`
- asserts startup prewarm can be disabled via env flag

**Step 2: Run test to verify it fails**

Run: `node scripts/validate_background_field_prewarm_config.js`
Expected: FAIL before the helpers/export exist.

**Step 3: Write minimal implementation**

Add prewarm constants/helpers and a startup prewarm launcher in `server/sim-server.js`.

**Step 4: Run test to verify it passes**

Run: `node scripts/validate_background_field_prewarm_config.js`
Expected: PASS.

### Task 3: Implement startup prewarm without changing frontend flow

**Files:**
- Modify: `server/sim-server.js`
- Modify: `server/heatmap-runner.js`

**Step 1: Implement startup prewarm**

When the server boots, enqueue background-only precompute for the fixed buckets. Reuse existing cache directory and do not block HTTP startup on completion.

**Step 2: Keep focus playback flow unchanged**

Ensure `POST /api/heatmap/jobs` still computes full playback as before, but background-field lookup now prefers bucketed/prewarmed entries.

**Step 3: Run focused verification**

Run:
- `node scripts/validate_background_field_bucketed_cache.js`
- `node scripts/validate_background_field_prewarm_config.js`
- `node scripts/validate_background_field_cache_reuse.js`
- `node scripts/validate_background_field_budget_sync.js`

Expected: all PASS.

### Task 4: Confirm frontend needs no code changes

**Files:**
- Inspect: `src/app.js`

**Step 1: Verify existing flow**

Confirm the app still uses `/api/heatmap/jobs` and server-provided precomputed playback, so no frontend logic is needed for this optimization.

**Step 2: Record operational note**

Document that backend changes require restarting port `8891` for the new prewarm behavior to take effect.
