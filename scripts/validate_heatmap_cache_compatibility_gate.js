const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');
const serverJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const HEATMAP_ENGINE_VERSION = 'node-cache-v47';/.test(runnerJs),
  'Expected heatmap runner engine version to match the current heatmap cache version'
);

assert(
  /const EXPECTED_HEATMAP_ENGINE_VERSION = 'node-cache-v47';/.test(serverJs),
  'Expected sim-server cache gate to track the current heatmap engine version'
);

assert(
  /const EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v27';/.test(serverJs),
  'Expected sim-server cache gate to track the current background field engine version'
);

assert(
  /result\?\.meta\?\.engineVersion !== EXPECTED_HEATMAP_ENGINE_VERSION/.test(serverJs),
  'Expected sim-server cache compatibility check to reject stale heatmap cache versions'
);

assert(
  !/llmProvider\.enabled && \(result\?\.meta\?\.llmDecisionPlan\?\.failed/.test(serverJs)
  && /function shouldRefreshCachedDecisionPlan\(result\) \{[\s\S]*plan\.failed/.test(serverJs),
  'Expected stale or failed LLM decision plans to refresh separately instead of invalidating the whole heatmap cache'
);

console.log('validate_heatmap_cache_compatibility_gate: ok');
