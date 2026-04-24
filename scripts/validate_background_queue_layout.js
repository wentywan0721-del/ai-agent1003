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
    return { x: fallback.x, y: fallback.y, tangent: { x: 1, y: 0 }, normal: { x: 0, y: 1 }, progress: 0 };
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

function placeAgentNearRouteEnd(agent, metersFromEnd) {
  const pathShape = agent.path;
  const totalLength = Number(pathShape?.length || agent.pathLength || 0);
  const distanceAlong = Math.max(0, totalLength - metersFromEnd);
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

function buildSyntheticScenario(prepared, routeId, agentCount) {
  const route = prepared.routeById[routeId];
  assert(route, `expected route ${routeId} to exist`);
  const profile = Sim.buildFocusProfile({
    capacityScores: { locomotor: 3, sensory: 3, cognitive: 3, psychological: 3, vitality: 3 },
  });
  const initialAgents = Array.from({ length: agentCount }, (_, index) => ({
    id: `layout-bg-${index}`,
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
    backgroundField: {
      version: 'layout-test',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents,
      frames: [],
    },
  });
  scenario.backgroundField = null;
  scenario.backgroundFieldActive = false;
  scenario.backgroundFieldCursor = 0;
  scenario.backgroundRoutePool = prepared.odRoutes.filter((candidate) => candidate.id !== routeId);
  scenario.backgroundAgents.forEach((agent, index) => {
    placeAgentNearRouteEnd(agent, 0.12 + index * 0.05);
  });
  return { scenario, agents: scenario.backgroundAgents };
}

function getFrameAgent(frame, id) {
  return (frame.agents || []).find((agent) => agent.id === id) || null;
}

function findQueuedSnapshots(field, agents, minimumCount) {
  const crowdedFrame = field.frames.find((frame) => {
    const queued = agents
      .map((agent) => getFrameAgent(frame, agent.id))
      .filter((snapshot) => snapshot?.backgroundState === 'queueing');
    return queued.length >= minimumCount;
  });
  assert(crowdedFrame, `expected a frame with at least ${minimumCount} queued passengers`);
  return agents
    .map((agent) => getFrameAgent(crowdedFrame, agent.id))
    .filter((snapshot) => snapshot?.backgroundState === 'queueing');
}

function clusterByGap(values, gapThreshold) {
  const sorted = values.slice().sort((left, right) => left - right);
  const clusters = [];
  sorted.forEach((value) => {
    const current = clusters[clusters.length - 1];
    if (!current || value - current[current.length - 1] > gapThreshold) {
      clusters.push([value]);
      return;
    }
    current.push(value);
  });
  return clusters;
}

function main() {
  const prepared = loadPrepared();

  const platformNode = prepared.nodeById.train_door3;
  const platformCase = buildSyntheticScenario(prepared, 'gate_in_to_train_door__gate_in_1__train_door3', 24);
  const platformField = Sim.precomputeBackgroundField(prepared, platformCase.scenario, {
    maxSimulationSeconds: 4,
    frameStepSeconds: 0.25,
  });
  const platformQueued = findQueuedSnapshots(platformField, platformCase.agents, 16);
  const platformXs = platformQueued.map((snapshot) => snapshot.position.x);
  const platformYs = platformQueued.map((snapshot) => snapshot.position.y);
  const leftOfDoor = platformQueued.filter((snapshot) => snapshot.position.x < platformNode.x - 0.4).length;
  const rightOfDoor = platformQueued.filter((snapshot) => snapshot.position.x > platformNode.x + 0.4).length;
  const nearDoorCluster = platformQueued.filter((snapshot) => Sim.distance(snapshot.position, platformNode) <= 2.4).length;
  const wallSpreadPassengers = platformQueued.filter((snapshot) => Math.abs(snapshot.position.x - platformNode.x) >= 2.2).length;
  assert(
    Math.min(...platformYs) >= platformNode.y - 1e-6,
    'expected platform waiting passengers to stay above the platform edge instead of spilling below it'
  );
  assert(
    Math.max(...platformYs) - Math.min(...platformYs) >= 1.2,
    'expected platform waiting passengers to keep a visible depth instead of collapsing into a flat wall line'
  );
  assert(
    leftOfDoor >= 4 && rightOfDoor >= 3,
    'expected the platform queue to fan out to both sides of the boarding point instead of staying one-sided'
  );
  assert(
    nearDoorCluster >= 5,
    'expected a visible loose cluster to remain around the real boarding point'
  );
  assert(
    wallSpreadPassengers >= 6,
    'expected overflow platform passengers to continue spreading along the wall away from the boarding point'
  );
  assert(
    Math.max(...platformXs) - Math.min(...platformXs) >= 12,
    'expected platform queue overflow to stretch far enough along the wall instead of remaining a tight local blob'
  );

  const elevatorNode = prepared.nodeById.elev_3;
  const elevatorCase = buildSyntheticScenario(prepared, 'gate_in_to_twl_down__gate_in_1__elev_3', 10);
  const elevatorField = Sim.precomputeBackgroundField(prepared, elevatorCase.scenario, {
    maxSimulationSeconds: 4,
    frameStepSeconds: 0.25,
  });
  const elevatorQueued = findQueuedSnapshots(elevatorField, elevatorCase.agents, 6);
  const elevatorYs = elevatorQueued.map((snapshot) => snapshot.position.y);
  const elevatorRadius = Math.max(...elevatorQueued.map((snapshot) => Sim.distance(snapshot.position, elevatorNode)));
  assert(
    Math.max(...elevatorYs) - Math.min(...elevatorYs) >= 2.5,
    'expected elevator waiting passengers to open into a visible doorway crowd patch instead of remaining a narrow line'
  );
  assert(
    elevatorRadius <= 5.5,
    'expected the elevator crowd patch to stay compact around the doorway'
  );
}

main();
console.log('validate_background_queue_layout: ok');
