const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function createPrepared() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8')
  );
  return Sim.prepareSimData(raw, { healthyAgents: [] });
}

function main() {
  const prepared = createPrepared();
  const startNode = prepared.nodeById.gate_in_1;
  const scenario = Sim.createScenario(prepared, {
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'kdt',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 3,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 3,
      },
    },
    seed: 1,
  });

  const state = Sim.deriveFiveDimensionStateAtPoint(prepared, scenario, { x: 24.09, y: 27.24 }, {
    profile: {
      capacityScores: {
        locomotor: 3,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 3,
      },
    },
    fatigue: 0,
    fatigueThreshold: 100,
  });

  assert.strictEqual(state.burdens.sensory.perceptionRadius, 10, 'Expected sensory score 3 to use a 10m perception radius');
  assert.strictEqual(state.burdens.sensory.objectLoad, 0, 'Expected objects outside the perception radius to be excluded from sensory object load');
  assert.deepStrictEqual(state.burdens.sensory.recognizedObjects, [], 'Expected no recognized objects outside the perception radius');
  assert.deepStrictEqual(state.burdens.sensory.missedObjects, [], 'Expected no missed objects outside the perception radius');
}

main();
console.log('validate_sensory_perception_radius_gating: ok');
