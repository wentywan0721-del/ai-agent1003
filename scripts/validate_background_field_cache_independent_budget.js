const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runnerSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

assert(
  /Math\.min\(\s*BACKGROUND_FIELD_MAX_SIMULATION_SECONDS,\s*Number\(options\.backgroundMinimumSimulationSeconds/.test(runnerSource),
  'background cache reuse should cap route-derived minimum duration at the background field maximum instead of rejecting reusable 480s fields for long low-capacity routes'
);

assert(
  !/options\?\.maxSimulationSecondsOverride\s*\|\|\s*heatOptions\.maxSimulationSeconds\s*\|\|\s*BACKGROUND_FIELD_MAX_SIMULATION_SECONDS/.test(runnerSource),
  'background field cache key should not depend on focus heatOptions.maxSimulationSeconds; route/focus budgets must not invalidate background crowd fields'
);

console.log('validate_background_field_cache_independent_budget: ok');
