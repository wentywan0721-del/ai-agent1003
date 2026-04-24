const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [20, 0],
        [20, 10],
        [0, 10],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 5, z: 0 },
      { id: 'gate_out_1', x: 19, y: 5, z: 0 },
    ],
    pressureObjects: [],
    seats: [
      { id: 'seat_1', label: 'Seat 1', x: 10, y: 7, z: 0, seatCount: 1, reliefStrength: 0.6, reliefRange: 2.5 },
    ],
  });
}

function createScenario(prepared) {
  const start = prepared.nodeById.gate_in_1;
  return Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: start.x, y: start.y, z: start.z },
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
}

function main() {
  const prepared = createPrepared();
  const scenario = createScenario(prepared);
  Sim.activateHeatmap(prepared, scenario, {});
  const agent = scenario.focusAgent;
  agent.profile.disableShortRest = true;
  agent.fatigue = 84.99;
  agent.pathProgressDist = agent.path.length - 0.01;
  agent.progressDist = agent.pathProgressDist;
  agent.progress = agent.pathProgressDist / Math.max(1e-6, agent.path.length);
  agent.position = { x: 18.99, y: 5 };
  agent.center = { x: 18.99, y: 5 };
  agent.decisionPauseRemaining = 0;
  agent.decisionInteractionState = null;
  agent.decisionInteractionPath = null;
  agent.decisionWrongTurnRemaining = 0;
  agent.decisionBacktrackRemaining = 0;

  Sim.stepScenario(prepared, scenario, 0.18, {
    deferPostProcess: true,
    maxSubstepSeconds: 0.18,
  });

  assert(
    agent.fatigue >= agent.profile.seatSearchThresholdPercent,
    'test setup should cross the seat-search fatigue threshold after movement'
  );
  assert.strictEqual(
    agent.active,
    false,
    'when the target is already visible at route end, the focus agent should finish traversal instead of forcing seat-search'
  );
  assert.strictEqual(
    agent.restState,
    'none',
    'when the target is already visible at route end, the focus agent should not enter seat-search'
  );
  assert.strictEqual(
    scenario.firstPassComplete,
    true,
    'heat playback should mark the first pass complete when the visible target is reached directly'
  );
}

main();
console.log('validate_focus_rest_search_defers_finish: ok');
