const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const Runner = require('../server/heatmap-runner.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function estimateFocusBudgetSeconds(scenario, requestedSeconds) {
  const requested = Math.max(30, Number(requestedSeconds || 0));
  const pathLength = Number(scenario?.focusAgent?.pathLength || scenario?.focusRoute?.pathLength || 0);
  const walkingSpeed = Math.max(0.15, Number(scenario?.focusAgent?.profile?.walkingSpeed || 0.9));
  const baseTravelSeconds = pathLength > 0 ? pathLength / walkingSpeed : 0;
  const recommended = Math.ceil((baseTravelSeconds * 1.18 + 24) / 12) * 12;
  return Math.max(requested, Math.min(960, recommended || requested));
}

function main() {
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount: 700,
  });

  const focusBudget = estimateFocusBudgetSeconds(scenario, 480);
  const backgroundBudget = Runner.estimateBackgroundFieldBudgetSeconds(scenario, 480);

  assert(
    backgroundBudget >= focusBudget,
    `expected background field budget (${backgroundBudget}s) to cover full focus playback budget (${focusBudget}s)`
  );
}

main();
console.log('validate_background_field_budget_sync: ok');
