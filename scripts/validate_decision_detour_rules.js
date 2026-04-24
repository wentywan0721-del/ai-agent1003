const assert = require('assert');

const Sim = require('../src/core.js');

function createPrepared(pressureObjects) {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [30, 0],
        [30, 20],
        [0, 20],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 10 },
      { id: 'node_mid', x: 10, y: 10 },
      { id: 'gate_out_1', x: 29, y: 10 },
    ],
    pressureObjects,
    seats: [],
  }, {
    healthyAgents: [],
  });
}

function createScenarioWithObject(pressureObjects, focusProfile = {}, rngValue = 0) {
  const prepared = createPrepared(pressureObjects);
  const scenario = Sim.createScenario(prepared, {
    startPoint: { x: 1, y: 10 },
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
      ...focusProfile,
    },
  });
  const focusAgent = scenario.focusAgent;
  focusAgent.pathProgressDist = 9;
  focusAgent.progressDist = 9;
  focusAgent.progress = 0.32;
  focusAgent.position = { x: 10, y: 10 };
  focusAgent.center = { x: 10, y: 10 };
  focusAgent.tangent = { x: 1, y: 0 };
  focusAgent.normal = { x: 0, y: 1 };
  focusAgent.offset = 0;
  focusAgent.activeDecisionNodeId = null;
  focusAgent.lastDecisionNodeId = null;
  scenario.rng = {
    state: 0,
    next: () => rngValue,
  };
  return { prepared, scenario, focusAgent };
}

function assertNearFacilityFront(target, source, expectedDistance = 1) {
  const currentDistance = Sim.distance(target, source);
  assert(
    Math.abs(currentDistance - expectedDistance) <= 0.45,
    `interaction target should stay about ${expectedDistance}m from the facility, got ${currentDistance.toFixed(3)}m`
  );
}

function main() {
  {
    const { prepared, scenario, focusAgent } = createScenarioWithObject([
      {
        id: 'guide-1',
        name: 'Common Direction Signs',
        feature: 'Exit A',
        category: 'signage',
        x: 10,
        y: 13,
        strength: 1,
        range: 6,
        activeForSimulation: true,
      },
    ]);
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    assert.strictEqual(focusAgent.decisionInteractionState, 'approach', 'ordinary guidance should start an approach interaction');
    assert.strictEqual(focusAgent.decisionInteractionMode, 'guide-review', 'ordinary guidance should use guide review mode');
    assert.strictEqual(focusAgent.decisionInteractionSourceId, 'guide-1', 'ordinary guidance should approach the matched guide');
    assertNearFacilityFront(focusAgent.decisionInteractionTarget, prepared.pressureById['guide-1']);
    assert(focusAgent.decisionInteractionProgress > 0, 'agent should start moving toward the guide');
    assert(focusAgent.position.y > 10.05, 'agent should detour toward the guide instead of pausing on the route');
  }

  {
    const { prepared, scenario, focusAgent } = createScenarioWithObject([
      {
        id: 'map-1',
        name: 'Panoramic Guide Map',
        feature: 'Detailed exit map',
        category: 'signage',
        x: 10,
        y: 13,
        strength: 1,
        range: 6,
        activeForSimulation: true,
      },
    ]);
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    assert.strictEqual(focusAgent.decisionInteractionSourceId, 'map-1', 'guide maps should also become detour targets');
    assertNearFacilityFront(focusAgent.decisionInteractionTarget, prepared.pressureById['map-1']);
  }

  {
    const { prepared, scenario, focusAgent } = createScenarioWithObject([
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
    ]);
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    assert.strictEqual(focusAgent.decisionInteractionState, 'approach', 'problem signage should also trigger an approach interaction');
    assert.strictEqual(focusAgent.decisionInteractionMode, 'problem-confirm', 'problem signage should use problem confirm mode');
    assert.strictEqual(focusAgent.decisionInteractionSourceId, 'problem-1', 'problem signage should be the confirmation target');
    assertNearFacilityFront(focusAgent.decisionInteractionTarget, prepared.pressureById['problem-1']);
  }

  {
    const { prepared, scenario, focusAgent } = createScenarioWithObject([
      {
        id: 'hang-1',
        name: 'Hanging Signs',
        feature: 'Provide high-visibility guidance in the form of icons',
        category: 'signage',
        x: 10,
        y: 13,
        strength: 1,
        range: 6,
        activeForSimulation: true,
      },
    ]);
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    assert.strictEqual(focusAgent.decisionInteractionState || null, null, 'hanging signs should not trigger detour confirmation behavior');
    assert.strictEqual(focusAgent.decisionInteractionSourceId || null, null, 'hanging signs should not become interaction targets');
  }

  {
    const { prepared, scenario, focusAgent } = createScenarioWithObject([
      {
        id: 'guide-continue',
        name: 'Common Direction Signs',
        feature: 'Exit A',
        category: 'signage',
        x: 10,
        y: 13,
        strength: 1,
        range: 6,
        activeForSimulation: true,
      },
    ], {}, 0.99);
    Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
    const interactionTarget = { ...focusAgent.decisionInteractionTarget };
    let sawReturnState = false;
    for (let step = 0; step < 80; step += 1) {
      Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });
      if (focusAgent.decisionInteractionState === 'return') {
        sawReturnState = true;
      }
      if (!focusAgent.decisionInteractionState && focusAgent.pathProgressDist > 0.1) {
        break;
      }
    }
    assert.strictEqual(sawReturnState, false, 'after reviewing a guide, the focus agent should continue from the guide point instead of walking back to the old route');
    assert(
      Sim.distance(focusAgent.path.startPoint, interactionTarget) <= 0.35,
      'after reviewing a guide, the refreshed route should start from the guide interaction point'
    );
    assert(
      focusAgent.pathProgressDist > 0.1,
      'after reviewing a guide, the focus agent should resume progressing toward the target region'
    );
  }
}

main();
console.log('validate_decision_detour_rules: ok');
