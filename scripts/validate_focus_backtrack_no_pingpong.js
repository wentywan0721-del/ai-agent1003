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
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 10 },
      { id: 'node_mid', x: 10, y: 10 },
      { id: 'gate_out_1', x: 35, y: 10 },
    ],
    pressureObjects: [
      {
        id: 'problem-1',
        name: 'Common Direction Signs',
        feature: 'Improper placement may confuse Exit A passengers',
        category: 'signage',
        x: 10,
        y: 13,
        strength: 1,
        range: 6,
        activeForSimulation: true,
      },
    ],
    seats: [],
  }, {
    healthyAgents: [],
  });
}

function main() {
  const prepared = createPrepared();
  const scenario = Sim.createScenario(prepared, {
    startPoint: { x: 1, y: 10, z: 0 },
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 3,
        sensory: 3,
        cognitive: 1,
        psychological: 3,
        vitality: 3,
      },
    },
    seed: 1,
  });
  scenario.rng = {
    state: 0,
    next: () => 0,
  };

  const focusAgent = scenario.focusAgent;
  let interactionStartCount = 0;
  let previousState = null;

  for (let step = 0; step < 200; step += 1) {
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    const currentState = focusAgent.decisionInteractionState || null;
    if (currentState === 'approach' && previousState !== 'approach') {
      interactionStartCount += 1;
    }
    previousState = currentState;
  }

  assert.strictEqual(
    interactionStartCount,
    1,
    'same decision node should not retrigger a second problem-confirm interaction before the agent leaves it'
  );
  assert(
    focusAgent.pathProgressDist > 2,
    'focus agent should keep progressing after one backtrack cycle instead of ping-ponging at the same sign'
  );
}

main();
console.log('validate_focus_backtrack_no_pingpong: ok');
