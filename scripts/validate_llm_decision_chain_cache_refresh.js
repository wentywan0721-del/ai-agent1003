const assert = require('assert');
const fs = require('fs');
const path = require('path');

const simServerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  /const EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION = 'llm-decision-chain-v\d+';/.test(simServerJs),
  'sim-server should have an independent LLM decision-chain cache version'
);

assert(
  /function shouldRefreshCachedDecisionPlan\(result\) \{[\s\S]*EXPECTED_LLM_DECISION_PLAN_CACHE_VERSION/.test(simServerJs),
  'cached heatmap compatibility should decide LLM decision-chain freshness separately from heatmap/background caches'
);

assert(
  /async function refreshCachedDecisionPlanOnly\(cacheKey, payload\) \{[\s\S]*runHeatmapDecisionPlanOnly[\s\S]*playback: currentCached\?\.heat \|\| currentCached\?\.playback \|\| null[\s\S]*mergeDecisionPlanIntoCachedPlayback\(cacheKey, analysis, \{ force: true/.test(simServerJs),
  'sim-server should refresh only the LLM decision plan from cached playback without recomputing heatmap/background fields'
);

assert(
  /let resultForResponse = cachedResult;[\s\S]*if \(shouldRefreshCachedDecisionPlan\(cachedResult\)\) \{[\s\S]*resultForResponse = await refreshCachedDecisionPlanOnly\(cacheKey, payload\)[\s\S]*\|\| cachedResult;[\s\S]*\.\.\.resultForResponse/.test(simServerJs),
  'cache-hit heatmap responses should return a refreshed decision chain when only the LLM chain is stale'
);

console.log('validate_llm_decision_chain_cache_refresh: ok');
