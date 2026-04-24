const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [40, 0],
        [40, 12],
        [0, 12],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 2, y: 6, z: 0 },
      { id: 'gate_out_1', x: 38, y: 6, z: 0 },
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
    startPoint: { x: 2, y: 6, z: 0 },
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
  agent.fatigue = 92;
  agent.pathProgressDist = agent.path.length * 0.55;
  agent.progressDist = agent.pathProgressDist;
  agent.progress = agent.pathProgressDist / Math.max(1e-6, agent.path.length);
  agent.position = { x: 22, y: 6 };
  agent.center = { x: 22, y: 6 };

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 1,
    maxExtendedSimulationSeconds: 10,
    precomputeStepSeconds: 0.24,
  });

  assert(
    playback.duration > 1.01,
    'focus playback should extend beyond the base maxSimulationSeconds while the focus agent is still searching for a seat'
  );
}

main();
console.log('validate_focus_playback_budget_extends_during_rest_search: ok');
