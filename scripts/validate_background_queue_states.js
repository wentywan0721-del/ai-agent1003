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

function main() {
  const prepared = loadPrepared();
  const elevatorRoute = prepared.routeById['gate_in_to_twl_down__gate_in_1__elev_3'];
  assert(elevatorRoute, 'expected a deterministic elevator route for queue validation');
  const profile = Sim.buildFocusProfile({});
  const initialAgents = [0, 1].map((index) => ({
    id: `synthetic-bg-${index}`,
    routeId: elevatorRoute.id,
    routeLabel: elevatorRoute.label,
    profile,
    active: true,
    pathProgressDist: 0,
    progressDist: 0,
    progress: 0,
    pathLength: 0,
    selectedTargetNodeId: elevatorRoute.endNodeIds?.[0] || null,
    selectedTargetNodeLabel: elevatorRoute.endNodeIds?.[0] || null,
    queueLocked: false,
    restState: 'none',
    restMode: null,
    reservedSeatId: null,
    position: { x: elevatorRoute.startAnchor.x, y: elevatorRoute.startAnchor.y },
    center: { x: elevatorRoute.startAnchor.x, y: elevatorRoute.startAnchor.y },
    tangent: { x: 1, y: 0 },
    normal: { x: 0, y: 1 },
  }));
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundField: {
      version: 'queue-state-test',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents,
      frames: [],
    },
  });
  scenario.backgroundField = null;
  scenario.backgroundFieldActive = false;
  scenario.backgroundFieldCursor = 0;
  const leader = scenario.backgroundAgents[0];
  const follower = scenario.backgroundAgents[1];

  placeAgentNearRouteEnd(leader, 0.12);
  placeAgentNearRouteEnd(follower, 0.9);

  const field = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 8,
    frameStepSeconds: 0.25,
  });

  const frames = Array.isArray(field.frames) ? field.frames : [];
  assert(frames.length > 2, 'expected background field frames to be captured');

  const queuedFrame = frames.find((frame) => {
    const leaderSnapshot = frame.agents.find((agent) => agent.id === leader.id);
    const followerSnapshot = frame.agents.find((agent) => agent.id === follower.id);
    return (
      (leaderSnapshot?.backgroundState === 'riding' && followerSnapshot?.backgroundState === 'queueing')
      || (leaderSnapshot?.backgroundState === 'queueing' && followerSnapshot?.backgroundState === 'riding')
    );
  });
  assert(queuedFrame, 'expected one agent to ride while the other stays queued behind the same facility');

  const queuedLeader = queuedFrame.agents.find((agent) => agent.id === leader.id);
  const queuedFollower = queuedFrame.agents.find((agent) => agent.id === follower.id);
  assert.strictEqual(queuedLeader.queueTargetNodeId, queuedFollower.queueTargetNodeId, 'leader and follower should queue for the same facility');
  assert(
    queuedLeader.queueSlotIndex === 1 || queuedFollower.queueSlotIndex === 1,
    'one of the two agents should occupy the queued follower slot'
  );
  assert(
    Sim.distance(queuedLeader.position, queuedFollower.position) > 0.4,
    'queued follower should stand visibly behind the riding leader'
  );

  const takeoverFrame = frames.find((frame) => {
    const leaderSnapshot = frame.agents.find((agent) => agent.id === leader.id);
    const followerSnapshot = frame.agents.find((agent) => agent.id === follower.id);
    return (
      (leaderSnapshot && !leaderSnapshot.active && followerSnapshot?.backgroundState === 'riding')
      || (followerSnapshot && !followerSnapshot.active && leaderSnapshot?.backgroundState === 'riding')
    );
  });
  assert(takeoverFrame, 'expected the remaining queued agent to start riding after the first rider disappears');
}

main();
console.log('validate_background_queue_states: ok');
