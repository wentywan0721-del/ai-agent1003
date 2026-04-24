const fs = require('fs');
const path = require('path');

const runnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function estimateBackgroundFieldBudgetSeconds\(/.test(runnerJs),
  'Expected server heatmap runner to estimate a background field budget from the active route'
);

assert(
  /const backgroundMinimumSimulationSeconds = focusPlaybackHeatOptions\.maxSimulationSeconds;/.test(runnerJs),
  'Expected background playback to use the focus playback duration as a minimum budget'
);

assert(
  /if \(backgroundField && Number\(backgroundField\.duration \|\| 0\) \+ 1e-6 < backgroundMinimumSimulationSeconds\)/.test(runnerJs),
  'Expected cached background fields shorter than the focus playback to be rejected'
);

assert(
  /maxSimulationSeconds: estimateBackgroundFieldBudgetSeconds\([\s\S]*focusBudgetScenario,[\s\S]*requestedBackgroundHeatOptions\.maxSimulationSeconds[\s\S]*\)/.test(runnerJs),
  'Expected preview and final background fields to keep the adaptive budget helper so long routes do not freeze mid-playback'
);

assert(
  /estimateBackgroundFieldBudgetSeconds\(\s*focusBudgetScenario,\s*requestedBackgroundHeatOptions\.maxSimulationSeconds\s*\)/.test(runnerJs),
  'Expected background duration to be estimated from the current focus route, not an unrelated long background route'
);

console.log('validate_heatmap_background_budget_adaptive: ok');
