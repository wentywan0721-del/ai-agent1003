const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function nearestGridCell(prepared, point) {
  return prepared.grid.cells.reduce((best, cell) => {
    const currentDistance = Sim.distance(cell, point);
    return !best || currentDistance < best.distance
      ? { cell, distance: currentDistance }
      : best;
  }, null)?.cell || null;
}

function main() {
  const prepared = loadPrepared();
  const startNode = prepared.nodeById.gate_in_4;
  assert(startNode, 'expected Exit D entry gate node');
  const densityCell = nearestGridCell(prepared, startNode);
  assert(densityCell, 'expected a grid cell near the focus agent');

  const backgroundField = {
    initialTime: 0,
    duration: 10,
    frames: [{ time: 0, agents: [] }],
    densityFrames: [{
      time: 0,
      occupiedCellIndices: [densityCell.index],
      occupiedCellCounts: [20],
    }],
    queueFrames: [],
  };

  const scenario = Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'exit_c',
    backgroundCrowdCount: 1,
    backgroundField,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260427,
  });

  const agent = scenario.focusAgent;
  agent.restState = 'sitting';
  agent.restMode = 'sitting';
  agent.restResumeThreshold = 80;
  agent.fatigue = 90;
  agent.reservedSeatId = 'synthetic-seat';

  Sim.stepScenario(prepared, scenario, 0.18, {
    deferPostProcess: true,
    maxSubstepSeconds: 0.18,
  });

  assert.strictEqual(
    agent.restState,
    'sitting',
    'once the focus agent has reached a seat, crowd density should not demote sitting rest into slow standing recovery'
  );
  assert(
    agent.fatigue < 90 && agent.fatigue <= 89.95,
    'sitting rest should use the faster sitting recovery rate'
  );
}

main();
console.log('validate_focus_sitting_rest_not_interrupted_by_crowd_density: ok');
