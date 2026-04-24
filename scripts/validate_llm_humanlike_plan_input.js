const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const runner = require('../server/heatmap-runner.js');

assert(
  runner.__private && typeof runner.__private.buildDecisionPlanInput === 'function',
  'Expected heatmap-runner to expose buildDecisionPlanInput via __private for validation'
);

const simData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
const prepared = Sim.prepareSimData(simData, { healthyAgents });
const scenario = Sim.createScenario(prepared, {
  focusRouteId: Sim.FOCUS_ROUTE_PRESETS?.[0]?.id || 'route1',
  backgroundCrowdCount: 700,
});

const input = runner.__private.buildDecisionPlanInput(prepared, scenario, {
  scenarioOptions: {
    focusRouteId: Sim.FOCUS_ROUTE_PRESETS?.[0]?.id || 'route1',
    backgroundCrowdCount: 700,
  },
});

assert(input && typeof input === 'object', 'Expected buildDecisionPlanInput() to return an input object');
assert(input.routeContext, 'Expected buildDecisionPlanInput() to include routeContext');
assert(
  Number.isFinite(Number(input.routeContext.pathLengthMeters)) && Number(input.routeContext.pathLengthMeters) > 0,
  'Expected routeContext.pathLengthMeters to describe the base route'
);
assert(
  Array.isArray(input.routeContext.pathSamples) && input.routeContext.pathSamples.length >= 3,
  'Expected routeContext.pathSamples to provide sampled direct-route context'
);
assert(
  Array.isArray(input.environmentContext?.sampleSummaries) && input.environmentContext.sampleSummaries.length >= 3,
  'Expected environmentContext.sampleSummaries to include pressure-aware path samples'
);
assert(
  input.environmentContext.sampleSummaries.some((item) => Number.isFinite(Number(item.noiseLevel))),
  'Expected sampled environment summaries to include noise context'
);
assert(
  input.environmentContext.sampleSummaries.some((item) => Number.isFinite(Number(item.wallDistance))),
  'Expected sampled environment summaries to include corridor / wall-clearance context'
);
assert(
  input.environmentContext.sampleSummaries.some((item) => Array.isArray(item.topPressureSources)),
  'Expected sampled environment summaries to include nearby pressure summaries'
);
assert(
  Object.prototype.hasOwnProperty.call(input.routeContext, 'decisionPointCount'),
  'Expected routeContext to keep explicit decision-point density information even for direct routes'
);
assert(
  Object.prototype.hasOwnProperty.call(input.routeContext, 'supportsAnchorGeneration'),
  'Expected routeContext to include a direct-route anchor generation hint'
);
assert.strictEqual(
  input.routeContext.decisionPointCount,
  Array.isArray(input.decisionPoints) ? input.decisionPoints.length : 0,
  'Expected routeContext.decisionPointCount to stay consistent with decisionPoints.length'
);

const trivialStartPoint = { x: 12.9, y: 33.1 };
const trivialScenario = Sim.createScenario(prepared, {
  startPoint: trivialStartPoint,
  targetRegionId: 'exit_a',
  backgroundCrowdCount: 100,
});
const trivialInput = runner.__private.buildDecisionPlanInput(prepared, trivialScenario, {
  scenarioOptions: {
    startPoint: trivialStartPoint,
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 100,
  },
});
assert(
  Number(trivialInput.routeContext?.pathLengthMeters) < 12,
  'Expected the trivial validation route to stay short'
);
assert.strictEqual(
  trivialInput.routeContext?.supportsAnchorGeneration,
  false,
  'Expected very short near-terminal routes not to advertise anchor generation support'
);

console.log('validate_llm_humanlike_plan_input: ok');
