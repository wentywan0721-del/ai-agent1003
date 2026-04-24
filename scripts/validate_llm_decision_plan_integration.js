const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PROJECT_ROOT = path.join(__dirname, '..');
const appJs = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'app.js'), 'utf8');
const coreJs = fs.readFileSync(path.join(PROJECT_ROOT, 'src', 'core.js'), 'utf8');
const runnerJs = fs.readFileSync(path.join(PROJECT_ROOT, 'server', 'heatmap-runner.js'), 'utf8');

assert(
  runnerJs.includes('llmDecisionPlan'),
  'Expected heatmap-runner serialization to include shared llmDecisionPlan output'
);

assert(
  coreJs.includes('buildFocusDecisionPlan') && coreJs.includes('applyFocusDecisionPlanAtNode'),
  'Expected core focus-agent logic to expose decision-plan build/apply helpers'
);

assert(
  !/data-call-route-analysis="true"/.test(appJs),
  'Expected Section 04 detail COT panel to stop rendering the old manual route-analysis trigger button'
);

assert(
  appJs.includes('hydrateRouteAnalysisFromHeatmapPlayback'),
  'Expected app to hydrate the route-analysis panel from heatmap playback metadata'
);

console.log('validate_llm_decision_plan_integration: ok');
