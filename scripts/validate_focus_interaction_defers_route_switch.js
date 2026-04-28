const assert = require('assert');

const Sim = require('../src/core.js');

function createBackgroundStub(focusAgent, index) {
  return {
    id: `bg-${index}`,
    isFocusAgent: false,
    active: true,
    role: 'background',
    profile: {
      walkingSpeed: 0.9,
      capacityScores: { vitality: 3 },
    },
    route: focusAgent.route,
    routeId: focusAgent.routeId,
    routeLabel: focusAgent.routeLabel,
    path: focusAgent.path,
    pathLength: focusAgent.path.length,
    pathProgressDist: 0,
    progressDist: 0,
    progress: 0,
    position: { x: 30, y: 10 },
    center: { x: 30, y: 10 },
    tangent: { x: 1, y: 0 },
    normal: { x: 0, y: 1 },
    currentPressure: 0,
    cognitiveLoad: 0,
    crowdDensity: 0,
    environmentNoise: 55,
    environmentLighting: 220,
    queueCount: 0,
    fatigue: 0,
    fatigueThreshold: 100,
    accumulatedStress: 0,
    pressureEventStates: {},
    currentLapTime: 0,
    lapFatiguePeak: 0,
    lastTravelTime: 0,
    offset: 0,
    nearestNeighborDistance: Number.POSITIVE_INFINITY,
    queueLocked: false,
    selectedTargetNodeId: 'es_down_1_top',
    selectedTargetNodeLabel: 'Kennedy Town Down 1',
    backgroundState: 'moving',
    queueSlotIndex: 0,
    rideRemaining: 0,
    queueTargetNodeId: null,
    queueJoinedAt: null,
    restState: 'none',
    restMode: null,
    reservedSeatId: null,
    laneBias: 0,
    personalBias: 0,
    startProgressJitter: 0,
    respawnTimer: 0,
  };
}

function main() {
  const prepared = Sim.prepareSimData({
    walkableAreas: [
      [
        [0, 0],
        [40, 0],
        [40, 25],
        [0, 25],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 1, y: 10 },
      { id: 'node_mid', x: 10, y: 10 },
      { id: 'es_down_1_top', x: 30, y: 10 },
      { id: 'stair_2_top', x: 30, y: 20 },
    ],
    pressureObjects: [
      {
        id: 'map-1',
        name: 'Panoramic Guide Map',
        feature: 'kennedy town',
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

  const scenario = Sim.createScenario(prepared, {
    backgroundCrowdCount: 1,
    startPoint: { x: 1, y: 10, z: 0 },
    targetRegionId: 'kdt',
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

  const focusAgent = scenario.focusAgent;
  const originalTargetNodeId = focusAgent.selectedTargetNodeId;
  for (let index = 0; index < 15; index += 1) {
    scenario.agents.push(createBackgroundStub(focusAgent, index));
  }

  scenario.rng = {
    state: 0,
    next: () => 0,
  };
  focusAgent.pathProgressDist = 9;
  focusAgent.progressDist = 9;
  focusAgent.progress = 0.3;
  focusAgent.position = { x: 10, y: 10 };
  focusAgent.center = { x: 10, y: 10 };
  focusAgent.tangent = { x: 1, y: 0 };
  focusAgent.normal = { x: 0, y: 1 };
  focusAgent.offset = 0;
  focusAgent.activeDecisionNodeId = null;
  focusAgent.lastDecisionNodeId = null;

  Sim.stepScenario(prepared, scenario, 0.18, { deferPostProcess: true });

  assert.strictEqual(focusAgent.decisionInteractionState, 'approach', 'expected guide review to physically approach the visible map');
  assert.strictEqual(focusAgent.decisionInteractionSourceId, 'map-1', 'expected the panoramic guide map to become the interaction source');
  assert(
    focusAgent.decisionInteractionPath && focusAgent.decisionInteractionPath.length > 0,
    'expected guide review to have a walkable physical interaction path'
  );
  assert.strictEqual(
    focusAgent.selectedTargetNodeId,
    originalTargetNodeId,
    'expected guide review to preserve the selected target while approaching the map'
  );
}

main();
console.log('validate_focus_interaction_defers_route_switch: ok');
