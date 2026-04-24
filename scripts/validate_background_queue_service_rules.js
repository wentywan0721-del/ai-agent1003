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

function createSyntheticScenario(prepared, routeId, agentCount, options = {}) {
  const route = prepared.routeById[routeId];
  assert(route, `expected route ${routeId} to exist`);
  const targetNodeId = route.endNodeIds?.[0] || null;
  const profile = options.profile || Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 3,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
    },
  });
  const initialAgents = Array.from({ length: agentCount }, (_, index) => ({
    id: `synthetic-bg-${index}`,
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
  scenario.backgroundRoutePool = prepared.odRoutes.filter((candidate) => (
    candidate.id !== routeId
    && !(candidate.endNodeIds || []).includes(targetNodeId)
  ));
  return { scenario, agents: scenario.backgroundAgents, route };
}

function buildLiveTerminalScenario(prepared, routeId, agentCount) {
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount: 160,
    seed: 1,
  });
  const matchingAgents = scenario.backgroundAgents.filter((agent) => agent.routeId === routeId);
  assert(
    matchingAgents.length >= agentCount,
    `expected at least ${agentCount} background agents on route ${routeId}, got ${matchingAgents.length}`
  );
  const selectedAgents = matchingAgents.slice(0, agentCount);
  scenario.backgroundAgents.forEach((agent) => {
    if (!selectedAgents.includes(agent)) {
      agent.active = false;
      agent.respawnTimer = Number.POSITIVE_INFINITY;
    }
  });
  selectedAgents.forEach((agent, index) => {
    placeAgentNearRouteEnd(agent, 0.12 + index * 0.12);
  });
  return { scenario, agents: selectedAgents };
}

function buildLiveRouteSelectionScenario(prepared, routeId, agentCount) {
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount: 300,
    seed: 1,
  });
  const matchingAgents = scenario.backgroundAgents.filter((agent) => agent.routeId === routeId);
  assert(
    matchingAgents.length >= agentCount,
    `expected at least ${agentCount} background agents on route ${routeId}, got ${matchingAgents.length}`
  );
  return { scenario, agents: matchingAgents.slice(0, agentCount) };
}

function countExplicitQueuedAtNode(frame, nodeId) {
  return (frame.agents || []).filter((agent) => (
    agent.queueTargetNodeId === nodeId
    && (agent.backgroundState === 'queueing' || agent.backgroundState === 'riding')
  )).length;
}

function countFlowingThroughAtNode(frame, nodeId) {
  return (frame.agents || []).filter((agent) => (
    agent.queueTargetNodeId === nodeId
    && (agent.backgroundState === 'terminal_waiting' || agent.backgroundState === 'terminal_serving')
  )).length;
}

function main() {
  const prepared = loadPrepared();

  const escalatorNode = prepared.nodeById.es_down_6_top;
  assert(escalatorNode, 'expected escalator node es_down_6_top to exist');
  assert.strictEqual(
    Sim.estimateFacilityWaitTime(escalatorNode, 3),
    3,
    'expected escalator wait time to scale at 1 second per queued passenger'
  );

  const flowThroughCase = buildLiveTerminalScenario(prepared, 'gate_in_to_twl_down__gate_in_1__es_down_6_top', 1);
  const flowThroughAgent = flowThroughCase.agents[0];
  const initialLapSerial = Math.max(0, Math.floor(Number(flowThroughAgent.backgroundFlowLapSerial || 0)));
  Sim.stepScenario(prepared, flowThroughCase.scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });
  assert.strictEqual(
    ['queueing', 'riding'].includes(flowThroughAgent.backgroundState),
    false,
    'escalator/gate/stair terminals should not fall back to the static queue states reserved for platform and lift'
  );
  assert(
    Math.max(0, Math.floor(Number(flowThroughAgent.backgroundFlowLapSerial || 0))) > initialLapSerial,
    'non-platform terminal riders should immediately finish and start a new lap once they reach the terminal'
  );
  assert.strictEqual(
    flowThroughAgent.active,
    true,
    'non-platform terminal riders should be restored onto the next lap after finishing at the terminal'
  );

  const multiTerminalRouteId = 'twl_up_to_gate_out__es_up_5_top__exit_b';
  const multiTerminalRoute = prepared.routeById[multiTerminalRouteId];
  assert(multiTerminalRoute, `expected route ${multiTerminalRouteId} to exist`);
  const multiTerminalCase = buildLiveRouteSelectionScenario(prepared, multiTerminalRouteId, 6);
  const assignedExitNodes = new Set(
    multiTerminalCase.agents.map((agent) => agent.selectedTargetNodeId)
  );
  assert(
    [...assignedExitNodes].every((nodeId) => multiTerminalRoute.endNodeIds.includes(nodeId)),
    'multi-terminal exit routes should only target one of their declared end nodes'
  );
  assert(
    assignedExitNodes.size > 1,
    'multi-terminal exit routes should distribute riders across multiple end nodes instead of collapsing onto the first node only'
  );

  const nonExplicitFlowCase = createSyntheticScenario(prepared, 'gate_in_to_twl_down__gate_in_1__es_down_6_top', 2);
  nonExplicitFlowCase.agents.forEach((agent, index) => placeAgentNearRouteEnd(agent, 0.1 + index * 0.14));
  const nonExplicitField = Sim.precomputeBackgroundField(prepared, nonExplicitFlowCase.scenario, {
    maxSimulationSeconds: 4,
    frameStepSeconds: 0.25,
  });
  const nonExplicitAtStart = nonExplicitField.frames.find((frame) => frame.time >= 0.25) || nonExplicitField.frames[1];
  const nonExplicitAtMid = nonExplicitField.frames.find((frame) => frame.time >= 1.5) || nonExplicitField.frames[nonExplicitField.frames.length - 1];
  const nonExplicitAtEnd = nonExplicitField.frames.find((frame) => frame.time >= 2.75) || nonExplicitField.frames[nonExplicitField.frames.length - 1];
  assert.strictEqual(
    countExplicitQueuedAtNode(nonExplicitAtStart, 'es_down_6_top'),
    0,
    'escalator endpoints should not use the static explicit queue states'
  );
  assert.strictEqual(
    countFlowingThroughAtNode(nonExplicitAtStart, 'es_down_6_top'),
    0,
    'escalator endpoints should no longer enter the temporary flowing-through terminal states'
  );
  assert.strictEqual(
    countFlowingThroughAtNode(nonExplicitAtMid, 'es_down_6_top'),
    0,
    'escalator endpoints should remain free of terminal waiting/serving states during playback'
  );
  assert.strictEqual(
    countFlowingThroughAtNode(nonExplicitAtEnd, 'es_down_6_top'),
    0,
    'escalator endpoints should directly disappear instead of lingering in a terminal service state'
  );

  const equalSpeedCase = createSyntheticScenario(prepared, 'gate_in_to_twl_down__gate_in_1__es_down_6_top', 2);
  const sameProfile = Sim.buildFocusProfile({
    capacityScores: {
      locomotor: 3,
      sensory: 3,
      cognitive: 3,
      psychological: 3,
      vitality: 3,
    },
  });
  equalSpeedCase.agents.forEach((agent, index) => {
    agent.profile = { ...sameProfile };
    placeAgentAtDistance(agent, 6 + index * 1.2);
  });
  const gapSamples = [];
  for (let step = 0; step < 12; step += 1) {
    gapSamples.push(Number((equalSpeedCase.agents[1].pathProgressDist - equalSpeedCase.agents[0].pathProgressDist).toFixed(3)));
    Sim.stepScenario(prepared, equalSpeedCase.scenario, 0.5, { deferPostProcess: true, skipFocusAgent: true });
  }
  const minGap = Math.min(...gapSamples);
  const maxGap = Math.max(...gapSamples);
  assert(
    maxGap - minGap > 0.05,
    `same-route background riders should not keep a perfectly locked gap forever; observed gaps: ${gapSamples.join(', ')}`
  );

  const elevatorCase = createSyntheticScenario(prepared, 'gate_in_to_twl_down__gate_in_1__elev_3', 14);
  elevatorCase.agents.forEach((agent, index) => placeAgentNearRouteEnd(agent, 0.12 + index * 0.05));
  const elevatorField = Sim.precomputeBackgroundField(prepared, elevatorCase.scenario, {
    maxSimulationSeconds: 60,
    frameStepSeconds: 0.25,
  });
  const elevatorAt14s = elevatorField.frames.find((frame) => frame.time >= 14) || elevatorField.frames[elevatorField.frames.length - 1];
  const elevatorAt20s = elevatorField.frames.find((frame) => frame.time >= 20) || elevatorField.frames[elevatorField.frames.length - 1];
  const elevatorAt55s = elevatorField.frames.find((frame) => frame.time >= 55) || elevatorField.frames[elevatorField.frames.length - 1];
  assert.strictEqual(countExplicitQueuedAtNode(elevatorAt14s, 'elev_3'), 1, 'expected first 13 elevator passengers to board within about 13 seconds');
  assert.strictEqual(countExplicitQueuedAtNode(elevatorAt20s, 'elev_3'), 1, 'expected exactly one elevator passenger to still wait for the next car at 20s');
  assert.strictEqual(countExplicitQueuedAtNode(elevatorAt55s, 'elev_3'), 0, 'expected the 14th elevator passenger to finish boarding after the 40s next-car delay');

  const platformCase = createSyntheticScenario(prepared, 'gate_in_to_train_door__gate_in_1__train_door1', 16);
  platformCase.agents.forEach((agent, index) => placeAgentNearRouteEnd(agent, 0.12 + index * 0.05));
  const platformField = Sim.precomputeBackgroundField(prepared, platformCase.scenario, {
    maxSimulationSeconds: 220,
    frameStepSeconds: 0.5,
  });
  const platformAt16s = platformField.frames.find((frame) => frame.time >= 16) || platformField.frames[platformField.frames.length - 1];
  const platformAt120s = platformField.frames.find((frame) => frame.time >= 120) || platformField.frames[platformField.frames.length - 1];
  const platformAt179s = platformField.frames.find((frame) => frame.time >= 179) || platformField.frames[platformField.frames.length - 1];
  const platformAt190s = platformField.frames.find((frame) => frame.time >= 190) || platformField.frames[platformField.frames.length - 1];
  const platformAt205s = platformField.frames.find((frame) => frame.time >= 205) || platformField.frames[platformField.frames.length - 1];
  assert.strictEqual(countExplicitQueuedAtNode(platformAt16s, 'train_door1'), 16, 'expected all platform passengers to still be visibly waiting before the first train arrives');
  assert.strictEqual(countExplicitQueuedAtNode(platformAt120s, 'train_door1'), 16, 'expected the initial platform queue to remain visible well before the first train arrives');
  assert(
    countExplicitQueuedAtNode(platformAt190s, 'train_door1') < countExplicitQueuedAtNode(platformAt179s, 'train_door1'),
    'expected the platform queue to start discharging only after the first train arrives around 180 seconds'
  );
  assert(
    countExplicitQueuedAtNode(platformAt205s, 'train_door1') < countExplicitQueuedAtNode(platformAt190s, 'train_door1'),
    'expected the platform queue to noticeably discharge after the next train opens even if replenished passengers keep arriving'
  );
}

main();
console.log('validate_background_queue_service_rules: ok');
