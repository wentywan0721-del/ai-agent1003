const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  const prepared = loadPrepared();
  const preset = prepared.focusRoutePresets.find((item) => item.id === 'route1') || prepared.focusRoutePresets[0];
  const scenario = Sim.createScenario(prepared, {
    focusProfile: {
      capacityScores: {
        locomotor: 3,
        sensory: 3,
        cognitive: 1,
        psychological: 3,
        vitality: 3,
      },
    },
    crowdPresetId: prepared.crowdPresets[0].id,
    focusRouteId: preset.id,
  });

  for (let step = 0; step < 24; step += 1) {
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
  }

  assert(
    scenario.focusAgent.pathProgressDist > 0.1,
    'focus agent should not remain frozen near route start when backtrack is impossible'
  );
}

main();
console.log('validate_focus_no_start_stall: ok');
