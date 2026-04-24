const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createScenario(prepared, overrides = {}) {
  return Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    startPoint: { x: 112.5, y: 63.2, z: 0 },
    targetRegionId: 'twl',
    focusProfile: {},
    ...overrides,
  });
}

function createVirtualAnchorPlan() {
  return {
    routeStyle: {
      crowdAvoidanceBias: 0.6,
      wallAvoidanceBias: 0.5,
      centerlineBias: 0.4,
      turnCommitmentBias: 0.7,
      hesitationBias: 0.3,
    },
    anchors: [
      {
        order: 1,
        nodeId: 'custom_start',
        anchorKind: 'scan',
        labelZh: '起点确认',
        labelEn: 'Start Confirmation',
      },
      {
        order: 2,
        nodeId: 'path_sample_3',
        anchorKind: 'scan',
        labelZh: '中点检查',
        labelEn: 'Midpoint Check',
      },
    ],
    timeline: [
      {
        order: 1,
        nodeId: 'path_sample_3',
        phase: 'confirm',
        thoughtZh: '在中段重新确认方向',
        thoughtEn: 'Reconfirm direction at mid-route',
        cueZh: '中点锚点',
        cueEn: 'Mid-route anchor',
      },
    ],
    decisions: [],
  };
}

function main() {
  const prepared = loadPrepared();
  const baselineScenario = createScenario(prepared);
  assert.strictEqual(
    baselineScenario.focusAgent.selectedTargetNodeId,
    'elev_3',
    'Expected the baseline rule route for this validation path to target the lift'
  );

  const scenario = createScenario(prepared, {
    llmDecisionPlan: createVirtualAnchorPlan(),
  });

  assert.strictEqual(
    scenario.focusAgent.selectedTargetNodeId,
    'elev_3',
    'Expected virtual anchors to preserve the original final destination instead of replacing it'
  );

  assert(
    /es_down_5_top/.test(String(scenario.focusRoute?.id || '')),
    'Expected path_sample virtual anchors to be converted into a real intermediate waypoint inside the focus route'
  );

  const anchorNode = prepared.nodeById.es_down_5_top;
  scenario.focusAgent.position = { x: anchorNode.x, y: anchorNode.y, z: anchorNode.z || 0 };
  scenario.focusAgent.center = { x: anchorNode.x, y: anchorNode.y, z: anchorNode.z || 0 };
  scenario.focusAgent.pathProgressDist = scenario.focusAgent.path.length;
  scenario.focusAgent.progressDist = scenario.focusAgent.path.length;
  scenario.focusAgent.progress = 1;
  scenario.focusAgent.queueLocked = false;
  scenario.focusAgent.activeDecisionNodeId = null;
  scenario.focusAgent.lastDecisionNodeId = null;

  Sim.stepScenario(prepared, scenario, 0.1, { deferPostProcess: true });

  assert.strictEqual(
    scenario.focusAgent.selectedTargetNodeId,
    'elev_3',
    'Expected the focus runtime to keep the final destination after completing a virtual anchor waypoint'
  );

  assert(
    !/es_down_5_top/.test(String(scenario.focusRoute?.id || '')),
    'Expected the completed virtual anchor waypoint to be removed from the remaining focus route'
  );
}

main();
console.log('validate_focus_virtual_anchor_mapping: ok');
