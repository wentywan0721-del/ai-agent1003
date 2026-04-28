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
    id: `density-bg-${index}`,
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
      version: 'density-test-seed',
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
  return scenario;
}

function main() {
  const prepared = loadPrepared();
  assert.strictEqual(
    typeof Sim.sampleBackgroundDensityField,
    'function',
    'expected core to export sampleBackgroundDensityField for direct density lookup'
  );

  const scenario = buildSyntheticScenario(prepared, 'gate_in_to_twl_down__gate_in_1__elev_3', 8);
  const backgroundField = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 6,
    frameStepSeconds: 0.25,
  });

  assert(Array.isArray(backgroundField.densityFrames), 'expected background field to expose time-sliced density frames');
  assert(backgroundField.densityFrames.length >= backgroundField.frames.length, 'expected density frames to be at least as dense as playback frames');
  assert(Array.isArray(backgroundField.queueFrames), 'expected background field to expose time-sliced queue frames');
  assert(backgroundField.queueFrames.length >= backgroundField.frames.length, 'expected queue frames to be at least as dense as playback frames');
  assert(
    backgroundField.frames.length < backgroundField.densityFrames.length,
    'expected playback frames to be sparsified separately from calculation density frames'
  );

  const probePoint = prepared.nodeById.elev_3;
  assert(probePoint, 'expected elevator node elev_3 to exist');
  const localDensity = Sim.sampleBackgroundDensityField(prepared, backgroundField, probePoint, 0.75, 'local');
  const perceptionDensity = Sim.sampleBackgroundDensityField(prepared, backgroundField, probePoint, 0.75, 'perception');
  assert(localDensity > 0, 'expected direct background density lookup to report non-zero local density near the active queue');
  assert(perceptionDensity > 0, 'expected direct background density lookup to report non-zero perceived density near the active queue');

  const queueFrame = backgroundField.queueFrames.find((frame) => (
    Array.isArray(frame.nodes) && frame.nodes.some((item) => item.nodeId === 'elev_3' && item.count > 0)
  ));
  assert(queueFrame, 'expected queue frames to preserve the queued population at the elevator node');
}

main();
console.log('validate_background_density_field: ok');
