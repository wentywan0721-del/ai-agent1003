const assert = require('assert');

const Sim = require('../src/core.js');
const simData = require('../data/111.sim.json');

function main() {
  const prepared = Sim.prepareSimData(simData, { healthyAgents: [] });
  const scenario = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: 12.4, y: 34.414, z: 0 },
    targetRegionId: 'kdt',
    backgroundCrowdCount: 0,
    focusProfile: {
      capacityScores: {
        locomotor: 5,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 4,
      },
    },
    llmDecisionPlan: {
      anchors: [
        { nodeId: 'elev_3', label: 'wrong elevator anchor' },
        { nodeId: 'gate_out_5', label: 'wrong exit anchor' },
      ],
    },
    seed: 20260428,
  });

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 120,
    maxExtendedSimulationSeconds: 240,
    precomputeStepSeconds: 0.18,
  });
  const trace = Array.isArray(playback.traceSnapshots) ? playback.traceSnapshots : [];
  assert(trace.length > 0, 'expected focus trace snapshots');

  const last = trace[trace.length - 1];
  const targetNode = prepared.nodeById[last.selectedTargetNodeId];
  assert(targetNode, 'expected selected target node to exist');

  const targetDistance = Math.hypot(last.x - targetNode.x, last.y - targetNode.y);
  assert.strictEqual(last.selectedTargetNodeId, 'es_down_4_top', 'expected Kennedy Town direction target to stay selected');
  assert.strictEqual(last.playbackComplete, true, 'expected route playback to complete');
  assert(
    targetDistance <= 0.75,
    `expected final trace to be near target; got ${targetDistance.toFixed(3)}m`
  );
}

main();
console.log('validate_focus_gate_in_to_kdt_route_completes: ok');
