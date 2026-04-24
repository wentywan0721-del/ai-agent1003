const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createWheelchairScenario(prepared, startNodeId, targetRegionId) {
  const startNode = prepared.nodeById[startNodeId];
  assert(startNode, `expected start node ${startNodeId}`);
  return Sim.createScenario(prepared, {
    startPoint: {
      x: startNode.x,
      y: startNode.y,
      z: startNode.z,
    },
    targetRegionId,
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 1,
        sensory: 1,
        cognitive: 1,
        psychological: 1,
        vitality: 1,
      },
    },
    seed: 20260411,
  });
}

function main() {
  const prepared = loadPrepared();

  [
    { startNodeId: 'stair_2_top', targetRegionId: 'kdt' },
    { startNodeId: 'train_door5', targetRegionId: 'kdt' },
    { startNodeId: 'stair_2_top', targetRegionId: 'twl' },
  ].forEach(({ startNodeId, targetRegionId }) => {
    const scenario = createWheelchairScenario(prepared, startNodeId, targetRegionId);
    assert.strictEqual(
      scenario.focusAgent.selectedTargetNodeId,
      'elev_3',
      `wheelchair route from ${startNodeId} to ${targetRegionId} should lock to elevator target`
    );
    assert(
      !String(scenario.focusRoute?.id || '').includes('__anchor__'),
      `wheelchair route from ${startNodeId} to ${targetRegionId} should not fall back to region anchor`
    );
  });
}

main();
console.log('validate_wheelchair_target_region_elevator_only: ok');
