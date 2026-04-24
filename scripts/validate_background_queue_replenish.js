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

function main() {
  const prepared = loadPrepared();
  let scenario = null;
  let queueRoute = null;
  for (let seed = 20260402; seed < 20260550; seed += 1) {
    const candidate = Sim.createScenario(prepared, {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 3,
      focusProfile: {},
      seed,
    });
    const matched = candidate.backgroundAgents.find((agent) => {
      const endNodeId = agent.route?.endNodeIds?.[0];
      return endNodeId && /train_door|elev_/i.test(String(endNodeId));
    });
    if (matched) {
      scenario = candidate;
      queueRoute = matched;
      break;
    }
  }
  assert(scenario, 'expected a deterministic scenario containing a queue-capable background route');
  assert(queueRoute, 'expected a queue-capable background route');

  scenario.backgroundAgents.forEach((agent, index) => {
    if (index === 0) {
      agent.route = queueRoute.route;
      agent.routeId = queueRoute.routeId;
      agent.routeLabel = queueRoute.routeLabel;
      agent.path = queueRoute.path;
      agent.pathLength = queueRoute.pathLength;
      agent.selectedTargetNodeId = queueRoute.selectedTargetNodeId;
      agent.selectedTargetNodeLabel = queueRoute.selectedTargetNodeLabel;
      placeAgentNearRouteEnd(agent, 0.08);
      return;
    }
    agent.active = false;
    agent.respawnTimer = 999;
  });

  const activeBefore = scenario.backgroundAgents.filter((agent) => agent.active).length;
  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  const queueingAgents = scenario.backgroundAgents.filter((agent) => (
    agent.active
    && (agent.backgroundState === 'queueing' || agent.backgroundState === 'riding')
  ));
  const spawnedAtStart = scenario.backgroundAgents.filter((agent) => (
    agent.active
    && agent.backgroundState === 'moving'
    && Number(agent.pathProgressDist || 0) <= 1e-6
  ));

  assert(queueingAgents.length >= 1, 'expected the original background agent to stay visible in the queue');
  assert(
    scenario.backgroundAgents.filter((agent) => agent.active).length > activeBefore,
    'expected queue entry to immediately replenish a new moving background agent from the start point'
  );
  assert(
    spawnedAtStart.length >= 1,
    'expected at least one replenished background agent to appear at route start when another enters the queue'
  );
}

main();
console.log('validate_background_queue_replenish: ok');
