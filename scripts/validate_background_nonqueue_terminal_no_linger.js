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
  const totalLength = Number(agent.path?.length || agent.pathLength || 0);
  const sample = samplePath(agent.path, distanceAlong);
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
  agent.backgroundState = 'moving';
  agent.queueTargetNodeId = null;
  agent.queueJoinedAt = null;
  agent.rideRemaining = 0;
}

function main() {
  const prepared = loadPrepared();
  const routeId = 'twl_up_to_gate_out__es_up_8_top__exit_b';
  const profile = Sim.buildFocusProfile({});
  const initialAgents = Array.from({ length: 6 }, (_, index) => ({
    id: `synthetic-short-${index}`,
    routeId,
    routeLabel: routeId,
    profile,
    active: true,
    pathProgressDist: 0,
    progressDist: 0,
    progress: 0,
    pathLength: 0,
    selectedTargetNodeId: 'gate_out_3',
    selectedTargetNodeLabel: 'gate_out_3',
    queueLocked: false,
    restState: 'none',
    restMode: null,
    reservedSeatId: null,
    position: { x: 0, y: 0 },
    center: { x: 0, y: 0 },
    tangent: { x: 1, y: 0 },
    normal: { x: 0, y: 1 },
  }));

  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundField: {
      version: 'nonqueue-terminal-no-linger',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents,
      frames: [],
    },
  });
  scenario.backgroundField = null;
  scenario.backgroundFieldActive = false;
  scenario.backgroundFieldCursor = 0;

  scenario.backgroundAgents.forEach((agent, index) => {
    const distanceAlong = Math.max(0, Number(agent.path.length || 0) - (0.25 + index * 0.35));
    placeAgentAtDistance(agent, distanceAlong);
  });

  const terminal = prepared.nodeById.gate_out_3;
  assert(terminal, 'expected gate_out_3 terminal node to exist');

  const field = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 3,
    frameStepSeconds: 0.08,
  });

  const streaksById = new Map();
  (field.frames || []).forEach((frame) => {
    (frame.agents || []).forEach((agent) => {
      const key = agent.id;
      const previous = streaksById.get(key) || { current: 0, max: 0 };
      const distanceToTerminal = Sim.distance(agent.position, terminal);
      if (agent.active && distanceToTerminal <= 1.2) {
        previous.current += 1;
        previous.max = Math.max(previous.max, previous.current);
      } else {
        previous.current = 0;
      }
      streaksById.set(key, previous);
    });
  });

  const maxTerminalLingerFrames = Math.max(...Array.from(streaksById.values()).map((item) => item.max));
  assert(
    maxTerminalLingerFrames <= 22,
    `non-platform/non-lift terminals should not visually hold riders near the endpoint for long queue-like streaks, got ${maxTerminalLingerFrames} frames`
  );
}

main();
console.log('validate_background_nonqueue_terminal_no_linger: ok');
