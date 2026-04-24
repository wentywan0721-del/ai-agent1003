const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [40, 0],
        [40, 20],
        [0, 20],
      ],
    ],
    obstacles: [
      [
        [14, 0],
        [16, 0],
        [16, 14],
        [14, 14],
      ],
    ],
    nodes: [
      { id: 'gate_in_1', x: 2, y: 10, z: 0 },
      { id: 'gate_out_1', x: 34, y: 10, z: 0 },
    ],
    pressureObjects: [],
    seats: [
      { id: 'seat_1', label: 'Seat 1', x: 20, y: 10, z: 0, seatCount: 1, reliefStrength: 0.6, reliefRange: 2.5 },
    ],
  });
}

function main() {
  const prepared = createPrepared();
  const scenario = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: 2, y: 10, z: 0 },
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260424,
  });

  const agent = scenario.focusAgent;
  agent.restState = 'searching';
  agent.restMode = 'seat-search';
  agent.restTargetSeatId = 'seat_1';
  agent.fatigue = 90;
  agent.position = { x: 10, y: 10 };
  agent.center = { x: 10, y: 10 };

  for (let index = 0; index < 520; index += 1) {
    Sim.stepScenario(prepared, scenario, 0.24, {
      deferPostProcess: true,
      maxSubstepSeconds: 0.24,
    });
    if (agent.restState === 'sitting') {
      break;
    }
  }

  assert.strictEqual(
    agent.restState,
    'sitting',
    'seat-search should follow a walkable route around obstacles and eventually reach the seat'
  );
  assert.strictEqual(
    agent.reservedSeatId,
    'seat_1',
    'seat-search should reserve the reached seat after arriving'
  );
}

main();
console.log('validate_focus_rest_search_uses_walkable_path: ok');
