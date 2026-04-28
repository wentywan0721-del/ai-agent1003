const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  /function countAgentsNearNode\s*\(scenario,\s*node,\s*excludeAgentId\)[\s\S]*?backgroundFieldSummaryOnlyActive[\s\S]*?getBackgroundFieldQueueCountAtCursor/.test(coreSource),
  'countAgentsNearNode should use background queue summaries instead of scanning stale playback agents during summary-only focus precompute'
);

assert(
  /function countAgentsWithinNodeRadius\s*\(scenario,\s*node,\s*radius,\s*excludeAgentId\)[\s\S]*?backgroundFieldSummaryOnlyActive[\s\S]*?return 0;/.test(coreSource),
  'ordinary node radius counts should not scan stale background playback agents during summary-only focus precompute'
);

console.log('validate_background_field_summary_counting: ok');
