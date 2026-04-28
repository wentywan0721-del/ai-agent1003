const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  const prepared = Sim.prepareSimData(raw, { healthyAgents });
  const start = prepared.nodeById.gate_in_1;

  const baseline = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: start.x, y: start.y, z: start.z || 0 },
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
    seed: 20260428,
  });

  const withBadAnchors = Sim.createScenario(prepared, {
    startNodeId: 'gate_in_1',
    startPoint: { x: start.x, y: start.y, z: start.z || 0 },
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
      routeStyle: {
        crowdAvoidanceBias: 0.4,
        wallAvoidanceBias: 0.4,
        centerlineBias: 0.4,
      },
      anchors: [
        { order: 1, nodeId: 'elev_3', anchorKind: 'scan', labelEn: 'Wrong lift anchor' },
        { order: 2, nodeId: 'gate_out_5', anchorKind: 'scan', labelEn: 'Wrong exit anchor' },
      ],
    },
    seed: 20260428,
  });

  assert.strictEqual(
    withBadAnchors.focusAgent.selectedTargetNodeId,
    baseline.focusAgent.selectedTargetNodeId,
    'LLM anchors must not change the deterministic selected target node'
  );
  assert.strictEqual(
    withBadAnchors.focusRoute.id,
    baseline.focusRoute.id,
    'LLM anchors must not be inserted into the physical focus route by default'
  );
  assert(!/elev_3|gate_out_5/.test(withBadAnchors.focusRoute.id), 'bad LLM anchors must not appear in the physical route id');
}

main();
console.log('validate_llm_anchors_do_not_hijack_physical_route: ok');
