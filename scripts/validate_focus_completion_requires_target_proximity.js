const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [24, 0],
        [24, 12],
        [0, 12],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 6, z: 0 },
      { id: 'gate_out_1', x: 22, y: 6, z: 0 },
    ],
    pressureObjects: [],
    seats: [],
  });
}

function main() {
  const prepared = createPrepared();
  const scenario = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: 1, y: 6, z: 0 },
    targetRegionId: 'exit_a',
    backgroundCrowdCount: 0,
    focusProfile: {
      capacityScores: {
        locomotor: 5,
        sensory: 5,
        cognitive: 5,
        psychological: 5,
        vitality: 5,
      },
    },
    seed: 20260428,
  });
  Sim.activateHeatmap(prepared, scenario, {});
  const agent = scenario.focusAgent;

  agent.position = { x: 12, y: 6 };
  agent.center = { x: 12, y: 6 };
  agent.pathProgressDist = agent.path.length;
  agent.progressDist = agent.path.length * 3;
  agent.progress = 1;
  agent.currentWalkingSpeed = 0.9;
  agent.restState = 'none';
  agent.decisionInteractionState = null;
  agent.decisionInteractionPath = null;

  Sim.stepScenario(prepared, scenario, 0.18, {
    deferPostProcess: true,
    maxSubstepSeconds: 0.18,
  });

  assert.strictEqual(agent.active, false, 'focus agent should finish when the logical route sample reaches the actual target node');
  assert.strictEqual(scenario.firstPassComplete, true, 'first pass should complete when the logical route sample reaches the actual target node');
  assert(
    Math.hypot(agent.position.x - 22, agent.position.y - 6) <= 0.75,
    'focus agent visual position should snap to the actual target before completing'
  );
  assert.strictEqual(agent.selectedTargetNodeId, 'gate_out_1', 'reroute must preserve the real selected target node');
}

main();
console.log('validate_focus_completion_requires_target_proximity: ok');
