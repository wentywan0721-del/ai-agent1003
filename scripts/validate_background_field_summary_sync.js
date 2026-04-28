const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  /function syncScenarioBackgroundField\s*\(prepared,\s*scenario,\s*targetTime,\s*options\s*=\s*\{\}\)/.test(coreSource),
  'syncScenarioBackgroundField should accept options so precompute can request summary-only sync'
);

assert(
  /summaryOnly\s*=\s*Boolean\(options\?\.summaryOnly\)/.test(coreSource),
  'background field sync should detect summaryOnly mode'
);

assert(
  /syncScenarioBackgroundField\(prepared,\s*scenario,\s*scenario\.time,\s*\{\s*summaryOnly:\s*deferPostProcess\s*\}\)/.test(coreSource),
  'precompute stepScenario should use summary-only background sync when deferPostProcess is enabled'
);

assert(
  /scenario\.backgroundFieldQueueCounts/.test(coreSource),
  'summary-only sync should expose queue counts without materializing every background agent'
);

assert(
  /computeQueuePopulation[\s\S]*?backgroundFieldQueueCounts/.test(coreSource),
  'queue population should read summary queue counts while using a background field'
);

console.log('validate_background_field_summary_sync: ok');
