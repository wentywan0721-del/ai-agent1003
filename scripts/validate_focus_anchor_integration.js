const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createAnchorOnlyPlan() {
  return {
    routeStyle: {
      crowdAvoidanceBias: 0.61,
      wallAvoidanceBias: 0.42,
      centerlineBias: 0.37,
      turnCommitmentBias: 0.66,
      hesitationBias: 0.21,
    },
    anchors: [
      {
        order: 1,
        nodeId: 'es_up_8_top',
        anchorKind: 'checkpoint',
        labelZh: '先靠近右侧上行口',
        labelEn: 'Approach the right-side up escalator first',
      },
      {
        order: 2,
        nodeId: 'es_up_7_top',
        anchorKind: 'checkpoint',
        labelZh: '再转向中段上行口',
        labelEn: 'Then continue toward the mid up escalator',
      },
    ],
    timeline: [
      {
        order: 1,
        nodeId: 'es_up_8_top',
        phase: 'orient',
        thoughtZh: '先找到最近的上行口。',
        thoughtEn: 'Find the nearest up escalator first.',
        cueZh: '右前方扶梯',
        cueEn: 'Escalator ahead on the right',
      },
    ],
    decisions: [],
  };
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

function main() {
  const prepared = loadPrepared();
  const baselineScenario = createScenario(prepared);
  const baselinePlan = Sim.buildFocusDecisionPlan(prepared, baselineScenario, baselineScenario.focusAgent, {});

  assert.strictEqual(
    baselinePlan.decisions.length,
    0,
    'expected the selected validation route to have no classic decision nodes'
  );

  assert(
    baselineScenario.focusAgent.selectedTargetNodeId,
    'expected baseline rule routing to select a deterministic terminal node'
  );

  const anchorScenario = createScenario(prepared, {
    llmDecisionPlan: createAnchorOnlyPlan(),
  });

  assert.strictEqual(
    anchorScenario.focusAgent.selectedTargetNodeId,
    baselineScenario.focusAgent.selectedTargetNodeId,
    'expected anchor-only LLM plans to preserve the original terminal node as the final destination'
  );

  assert.strictEqual(
    anchorScenario.focusRoute?.id,
    baselineScenario.focusRoute?.id,
    'expected LLM anchors to stay narrative-only and not shape the physical focus route by default'
  );

  const firstAnchor = prepared.nodeById.es_up_8_top;
  anchorScenario.focusAgent.position = { x: firstAnchor.x, y: firstAnchor.y, z: firstAnchor.z || 0 };
  anchorScenario.focusAgent.center = { x: firstAnchor.x, y: firstAnchor.y, z: firstAnchor.z || 0 };
  anchorScenario.focusAgent.pathProgressDist = anchorScenario.focusAgent.path.length;
  anchorScenario.focusAgent.progressDist = anchorScenario.focusAgent.path.length;
  anchorScenario.focusAgent.progress = 1;
  anchorScenario.focusAgent.queueLocked = false;
  anchorScenario.focusAgent.activeDecisionNodeId = null;
  anchorScenario.focusAgent.lastDecisionNodeId = null;

  Sim.stepScenario(prepared, anchorScenario, 0.1, { deferPostProcess: true });

  assert.strictEqual(
    anchorScenario.focusAgent.selectedTargetNodeId,
    baselineScenario.focusAgent.selectedTargetNodeId,
    'expected the focus runtime to keep the original terminal node after advancing past an anchor waypoint'
  );

  assert.strictEqual(
    anchorScenario.focusRoute?.id,
    baselineScenario.focusRoute?.id,
    'expected the focus runtime to keep the deterministic route after passing a narrative anchor'
  );

  const invalidAnchorScenario = createScenario(prepared, {
    llmDecisionPlan: {
      ...createAnchorOnlyPlan(),
      anchors: [
        {
          order: 1,
          nodeId: 'missing_anchor_node',
          anchorKind: 'checkpoint',
          labelZh: '无效锚点',
          labelEn: 'Invalid anchor',
        },
      ],
    },
  });

  assert.strictEqual(
    invalidAnchorScenario.focusAgent.selectedTargetNodeId,
    baselineScenario.focusAgent.selectedTargetNodeId,
    'expected invalid anchors to fall back to the existing rule-based target selection'
  );
}

main();
console.log('validate_focus_anchor_integration: ok');
