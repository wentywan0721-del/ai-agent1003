const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  const prepared = loadPrepared();
  const startNode = prepared.nodeById.gate_in_4;
  assert(startNode, 'expected Exit D entry gate node');

  const scenario = Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'exit_c',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 5,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 3,
      },
    },
    llmDecisionPlan: {
      routeStyle: {},
      anchors: [
        {
          order: 1,
          nodeId: 'gate_in_4',
          anchorKind: 'scan',
          labelZh: '出口D检查',
          labelEn: 'Exit D check',
        },
        {
          order: 2,
          nodeId: 'elev_3',
          anchorKind: 'scan',
          labelZh: '电梯附近休息点',
          labelEn: 'Elevator rest spot',
          noteZh: '坐下休息，恢复体力',
          noteEn: 'Sit down and rest to recover fatigue',
        },
      ],
      timeline: [],
    },
    seed: 20260427,
  });

  assert.strictEqual(
    scenario.focusAgent.selectedTargetNodeId,
    'gate_out_4',
    'expected the final target to remain the selected Exit C gate'
  );
  assert(
    !String(scenario.focusRoute?.id || '').includes('elev_3'),
    'rest/narrative LLM anchors must not become required physical route waypoints'
  );
}

main();
console.log('validate_focus_rest_anchor_does_not_hijack_route: ok');
