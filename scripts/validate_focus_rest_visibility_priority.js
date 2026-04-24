const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared({ targetX = 18, targetY = 10, seatX = 2, seatY = 15 }) {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [24, 0],
        [24, 24],
        [0, 24],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 10, z: 0 },
      { id: 'gate_out_1', x: targetX, y: targetY, z: 0 },
    ],
    pressureObjects: [],
    seats: [
      { id: 'seat_1', label: 'Seat 1', x: seatX, y: seatY, z: 0, seatCount: 1, reliefStrength: 0.6, reliefRange: 2.5 },
    ],
  });
}

function createScenario(prepared) {
  const start = prepared.nodeById.gate_in_1;
  return Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: start.x, y: start.y, z: start.z || 0 },
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 3,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260424,
  });
}

function main() {
  {
    const prepared = createPrepared({ targetX: 6, targetY: 10, seatX: 2, seatY: 15 });
    const scenario = createScenario(prepared);
    const agent = scenario.focusAgent;
    agent.fatigue = 86;
    agent.profile.disableShortRest = true;
    Sim.activateHeatmap(prepared, scenario, {});
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    assert.strictEqual(
      agent.restState,
      'none',
      'when both the seat and the target are visible at 85% fatigue, the focus agent should keep heading to the target instead of switching into seat-search'
    );
  }

  {
    const prepared = createPrepared({ targetX: 18, targetY: 10, seatX: 2, seatY: 15 });
    const scenario = createScenario(prepared);
    const agent = scenario.focusAgent;
    agent.fatigue = 86;
    agent.profile.disableShortRest = true;
    Sim.activateHeatmap(prepared, scenario, {});
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    assert.strictEqual(
      agent.restState,
      'searching',
      'when the target is not visible but a seat is visible at 85% fatigue, the focus agent should enter seat-search'
    );
  }

  {
    const prepared = createPrepared({ targetX: 10.5, targetY: 15, seatX: 2, seatY: 15 });
    const scenario = createScenario(prepared);
    const agent = scenario.focusAgent;
    Sim.activateHeatmap(prepared, scenario, {});
    agent.fatigue = 90;
    agent.profile.disableShortRest = true;
    agent.restState = 'searching';
    agent.restMode = 'seat-search';
    agent.restTargetSeatId = 'seat_1';
    agent.restSearchElapsed = 4;
    agent.position = { x: 2.1, y: 14.5, z: 0 };
    agent.center = { x: 2.1, y: 14.5, z: 0 };
    agent.tangent = { x: 0, y: 1 };
    agent.normal = { x: -1, y: 0 };
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    assert.strictEqual(
      agent.restState,
      'none',
      'when the focus agent is walking toward a seat and the target becomes visible again, seat-search should be abandoned immediately'
    );
  }
}

main();
console.log('validate_focus_rest_visibility_priority: ok');
