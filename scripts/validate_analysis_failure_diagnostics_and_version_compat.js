const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const COMPATIBLE_HEATMAP_ENGINE_VERSIONS = new Set\(\['node-cache-v33'\]\);/.test(appSource),
  'frontend should reject stale heatmap engine versions after LLM grounding and long-background playback changes'
);

assert(
  /const COMPATIBLE_BACKGROUND_FIELD_ENGINE_VERSIONS = new Set\(\['background-field-v24', 'background-field-v25'\]\);/.test(appSource),
  'frontend should accept both the previous and current background field versions while local server processes may be stale'
);

assert(
  /lastHeatmapError:\s*null/.test(appSource),
  'state should retain the last heatmap failure for debugging'
);

assert(
  /function recordHeatmapError\(phase, error\)/.test(appSource),
  'app should centralize heatmap error recording so Section02 fallback is diagnosable'
);

assert(
  /handleGenerateCrowd\(\);\s*if \(!state\.scenario \|\| !state\.crowdGenerated\) \{[\s\S]*throw new Error\(state\.heatmapRunError \|\| '场景生成失败。'\);[\s\S]*\}/.test(appSource),
  'Start Analysis should not silently continue when scenario generation failed'
);

assert(
  /lastHeatmapError:\s*state\.lastHeatmapError/.test(appSource),
  'debug snapshot should expose the last heatmap failure'
);

console.log('validate_analysis_failure_diagnostics_and_version_compat: ok');
