const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createFocusScenario(prepared, locomotorScore, targetRegionId) {
  const startNode = prepared.nodeById.gate_in_1;
  assert(startNode, 'expected gate_in_1 to exist');
  return Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: {
      x: startNode.x,
      y: startNode.y,
      z: startNode.z,
    },
    targetRegionId,
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: locomotorScore,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 3,
      },
    },
    seed: 20260423,
  });
}

function main() {
  const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
  assert(
    coreSource.includes('const BACKGROUND_ELEVATOR_ROUTE_WEIGHT_FACTOR = 0.02;'),
    'background elevator route weight factor should be reduced to 0.02'
  );

  const prepared = loadPrepared();
  ['kdt', 'twl'].forEach((targetRegionId) => {
    [1, 2].forEach((locomotorScore) => {
      const scenario = createFocusScenario(prepared, locomotorScore, targetRegionId);
      assert.strictEqual(
        scenario.focusAgent.selectedTargetNodeId,
        'elev_3',
        `locomotor-${locomotorScore} should use elevator for ${targetRegionId}`
      );
    });

    [3, 4, 5].forEach((locomotorScore) => {
      const scenario = createFocusScenario(prepared, locomotorScore, targetRegionId);
      assert(
        String(scenario.focusAgent.selectedTargetNodeId || '').startsWith('es_down_'),
        `locomotor-${locomotorScore} should prefer escalator over elevator/stair for ${targetRegionId}`
      );
    });
  });
}

main();
console.log('validate_focus_facility_priority_shortest: ok');
