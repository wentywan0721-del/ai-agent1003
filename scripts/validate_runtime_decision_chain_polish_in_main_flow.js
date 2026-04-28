const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

assert(
  runnerJs.includes("const FOCUS_HEATMAP_MAX_SIMULATION_SECONDS = 1800;"),
  'Expected focus heatmap extended simulation budget to allow low-capacity seated rests to resume'
);

assert(
  /stage:\s*'runtime-decision-chain-polish'/.test(runnerJs)
    && /runtimeTimelinePlan\s*=\s*await resolveLlmDecisionPlan\(prepared,\s*scenario,\s*payload,\s*playback\)\s*\|\|\s*runtimeFallback/.test(runnerJs)
    && /mergePreRuntimePlanWithRuntimeTimeline\(preRuntimePlan,\s*runtimeTimelinePlan\)/.test(runnerJs),
  'Expected main heatmap flow to polish the runtime-grounded timeline after playback, not only in the separate refinement path'
);

assert(
  /timelineSource:\s*fallback\?\.timelineSource\s*\|\|\s*'runtime-events'/.test(runnerJs),
  'Expected merged decision plan to preserve runtime timeline source metadata'
);

console.log('validate_runtime_decision_chain_polish_in_main_flow: ok');
