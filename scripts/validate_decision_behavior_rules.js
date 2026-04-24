const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function createDecisionTestState(name, feature = '') {
  const prepared = Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 1 },
      { id: 'gate_out_1', x: 18, y: 1 },
      { id: 'node_mid', x: 10, y: 1 },
    ],
    pressureObjects: [
      { id: 'p1', name, feature, category: 'signage', x: 10, y: 1, strength: 1, range: 5, activeForSimulation: true },
    ],
    seats: [],
  });
  const profile = Sim.buildFocusProfile({});
  const scenario = {
    agents: [],
    time: 0,
    focusTargetRegionId: 'exit_a',
    focusTargetRegion: prepared.targetRegionById.exit_a,
    focusAgent: {
      profile,
      selectedTargetNodeId: 'gate_out_1',
      selectedTargetNodeLabel: 'Exit A',
    },
  };
  return Sim.deriveFiveDimensionStateAtPoint(
    prepared,
    scenario,
    { x: 10, y: 1 },
    {
      profile,
      capacityScores: profile.capacityScores,
      fatigue: 0,
      fatigueThreshold: 100,
      queueCount: 0,
    }
  );
}

function main() {
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    focusProfile: {},
    crowdPresetId: prepared.crowdPresets[0].id,
    focusRouteId: prepared.focusRoutePresets[0].id,
  });
  assert.strictEqual(scenario.focusAgent.laneBias, 0, 'focus agent should keep a zero lane bias');
  assert.strictEqual(scenario.focusAgent.personalBias, 0, 'focus agent should not get a default lateral personal bias');
  assert.strictEqual(scenario.focusAgent.offset, 0, 'focus agent should start without a lateral offset');

  assert.strictEqual(
    Sim.classifyDecisionGuideFeature({ name: 'Hanging Signs', category: 'signage' }),
    null,
    'hanging signs should not be treated as behavior-driving guidance'
  );

  const hangingState = createDecisionTestState('Hanging Signs');
  assert.strictEqual(hangingState.context.decisionInputs.relevantGuideCount, 0, 'hanging signs should not count as relevant guides');
  assert(hangingState.context.decisionInputs.irrelevantSignCount > 0, 'hanging signs should still count as distractors');

  const commonDirectionalState = createDecisionTestState('Common Direction Signs', 'Exit A');
  assert(commonDirectionalState.context.decisionInputs.relevantGuideCount > 0, 'directional signs should still support decision behavior');
  assert(commonDirectionalState.burdens.cognitive.guideReviewPauseTime > 0, 'directional signs should still be able to trigger pause-and-recognize behavior');

  const mapState = createDecisionTestState('Panoramic Guide Map');
  const serviceState = createDecisionTestState('Customer Service Centre');
  const aiState = createDecisionTestState('AI virtual service ambassador');
  assert(mapState.context.decisionInputs.mapSupport > 0, 'panoramic guide maps should provide map support');
  assert(serviceState.context.decisionInputs.serviceSupport > 0, 'customer service centres should provide service support');
  assert(aiState.context.decisionInputs.serviceSupport > 0, 'AI assistants should provide service support');
  assert(mapState.burdens.cognitive.guideReviewPauseTime >= commonDirectionalState.burdens.cognitive.guideReviewPauseTime, 'map guidance should not pause less than ordinary directional signage');
}

main();
console.log('validate_decision_behavior_rules: ok');
