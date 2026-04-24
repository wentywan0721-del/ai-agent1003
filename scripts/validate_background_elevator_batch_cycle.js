const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function samplePath(pathShape, distanceAlong) {
  const totalLength = Number(pathShape?.length || 0);
  const safeDistance = Math.max(0, Math.min(totalLength, Number(distanceAlong || 0)));
  const segments = Array.isArray(pathShape?.segments) ? pathShape.segments : [];
  const fallback = pathShape?.endPoint || pathShape?.startPoint || { x: 0, y: 0 };
  if (!segments.length || totalLength <= 1e-6) {
    return {
      x: fallback.x,
      y: fallback.y,
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
      progress: 0,
    };
  }
  const segment = segments.find((item) => safeDistance <= item.endLength) || segments[segments.length - 1];
  const localT = Math.max(0, Math.min(1, (safeDistance - segment.startLength) / Math.max(segment.length, 1e-6)));
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * localT,
    y: segment.start.y + (segment.end.y - segment.start.y) * localT,
    tangent: { ...segment.tangent },
    normal: { ...segment.normal },
    progress: totalLength <= 1e-6 ? 0 : safeDistance / totalLength,
  };
}

function placeAgentAtDistance(agent, distanceAlong) {
  const pathShape = agent.path;
  const totalLength = Number(pathShape?.length || agent.pathLength || 0);
  const sample = samplePath(pathShape, distanceAlong);
  agent.pathProgressDist = distanceAlong;
  agent.progressDist = distanceAlong;
  agent.pathLength = totalLength;
  agent.progress = sample.progress;
  agent.position = { x: sample.x, y: sample.y };
  agent.center = { x: sample.x, y: sample.y };
  agent.tangent = { ...sample.tangent };
  agent.normal = { ...sample.normal };
  agent.active = true;
  agent.respawnTimer = 0;
}

function placeAgentNearRouteEnd(agent, metersFromEnd) {
  const totalLength = Number(agent.path?.length || agent.pathLength || 0);
  placeAgentAtDistance(agent, Math.max(0, totalLength - metersFromEnd));
}

function findIncomingElevatorRoute(prepared) {
  return prepared.odRoutes.find((route) => (
    Array.isArray(route?.endNodeIds)
    && route.endNodeIds.includes('elev_3')
    && String(route?.startGroupId || '').startsWith('gate_in')
  ));
}

function createScenario(prepared, backgroundCrowdCount = 12, seed = 20260422) {
  return Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount,
    seed,
  });
}

function createSyntheticScenario(prepared, routeId, agentCount, seed = 20260422) {
  const route = prepared.routeById[routeId];
  assert(route, `expected route ${routeId} to exist`);
  const profile = Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 3,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
    },
  });
  const initialAgents = Array.from({ length: agentCount }, (_, index) => ({
    id: `synthetic-elev-${index}`,
    routeId,
    routeLabel: route.label,
    profile,
    active: true,
    pathProgressDist: 0,
    progressDist: 0,
    progress: 0,
    pathLength: 0,
    selectedTargetNodeId: route.endNodeIds?.[0] || null,
    selectedTargetNodeLabel: route.endNodeIds?.[0] || null,
    queueLocked: false,
    restState: 'none',
    restMode: null,
    reservedSeatId: null,
    position: { x: route.startAnchor.x, y: route.startAnchor.y },
    center: { x: route.startAnchor.x, y: route.startAnchor.y },
    tangent: { x: 1, y: 0 },
    normal: { x: 0, y: 1 },
  }));
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    seed,
    backgroundField: {
      version: 'test-seed',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents,
      frames: [],
    },
  });
  scenario.backgroundField = null;
  scenario.backgroundFieldActive = false;
  scenario.backgroundFieldCursor = 0;
  return { scenario, agents: scenario.backgroundAgents, route };
}

function testElevatorCooldownAfterSingleBoarding(prepared) {
  const route = findIncomingElevatorRoute(prepared);
  assert(route, 'expected an incoming elevator route');
  const { scenario, agents } = createSyntheticScenario(prepared, route.id, 2, 2026042201);
  const [firstRider, secondRider] = agents;

  placeAgentNearRouteEnd(firstRider, 0.08);
  secondRider.active = false;
  secondRider.respawnTimer = Number.POSITIVE_INFINITY;

  Sim.stepScenario(prepared, scenario, 3.4, { deferPostProcess: true, skipFocusAgent: true });

  const queueState = scenario.backgroundFacilityQueues?.elev_3;
  assert(queueState, 'expected elevator queue state to exist after first rider boards');
  assert(
    Number(queueState.nextBoardReadyTime || 0) >= Number(scenario.time || 0) + 39,
    'expected elevator to enter a long cooldown after a lone rider boards and no second rider arrives within 2 seconds'
  );

  secondRider.active = true;
  secondRider.respawnTimer = 0;
  secondRider.route = route;
  secondRider.routeId = route.id;
  secondRider.routeLabel = route.label;
  secondRider.selectedTargetNodeId = 'elev_3';
  secondRider.selectedTargetNodeLabel = 'elev_3';
  placeAgentNearRouteEnd(secondRider, 0.08);

  Sim.stepScenario(prepared, scenario, 1.2, { deferPostProcess: true, skipFocusAgent: true });

  assert.strictEqual(
    secondRider.active,
    true,
    'expected later riders to remain in the elevator queue during the 40-second cooldown instead of disappearing immediately'
  );
  assert.strictEqual(
    secondRider.queueTargetNodeId,
    'elev_3',
    'expected later riders to stay attached to the elevator queue target during cooldown'
  );
  assert(
    secondRider.backgroundState === 'queueing' || secondRider.backgroundState === 'riding',
    'expected later riders to remain visibly queued at the elevator during cooldown'
  );
}

function testElevatorArrivalReleaseCap(prepared) {
  const scenario = createScenario(prepared, 30, 2026042202);
  const elevatorOriginRoutes = prepared.odRoutes.filter((route) => (
    String(route?.startGroupId || '') === 'elev_3'
  ));
  assert(elevatorOriginRoutes.length > 0, 'expected elevator-origin routes');

  const inactiveAgents = scenario.backgroundAgents.slice(0, 18);
  inactiveAgents.forEach((agent, index) => {
    const route = elevatorOriginRoutes[index % elevatorOriginRoutes.length];
    agent.route = route;
    agent.routeId = route.id;
    agent.routeLabel = route.label;
    agent.active = false;
    agent.respawnTimer = 0;
  });

  scenario.backgroundFacilityQueues.elev_3 = {
    nodeId: 'elev_3',
    queueDirection: { x: 0, y: 1 },
    boardingsInCurrentBatch: 0,
    nextBoardReadyTime: 0,
    pendingArrivalCount: 15,
  };

  Sim.stepScenario(prepared, scenario, 0.2, { deferPostProcess: true, skipFocusAgent: true });

  const releasedCount = inactiveAgents.filter((agent) => agent.active && String(agent.route?.startGroupId || '') === 'elev_3').length;
  assert.strictEqual(
    releasedCount,
    13,
    'expected each elevator return cycle to release at most 13 newly spawned riders from elev_3'
  );
}

function main() {
  const prepared = loadPrepared();
  testElevatorCooldownAfterSingleBoarding(prepared);
  testElevatorArrivalReleaseCap(prepared);
}

main();
console.log('validate_background_elevator_batch_cycle: ok');
