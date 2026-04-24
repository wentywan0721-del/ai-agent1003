const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function distance(left, right) {
  const dx = Number(left?.x || 0) - Number(right?.x || 0);
  const dy = Number(left?.y || 0) - Number(right?.y || 0);
  return Math.hypot(dx, dy);
}

function main() {
  const prepared = loadPrepared();
  const routeId = 'twl_up_to_gate_out__es_up_8_top__exit_b';
  const initialAgents = [
    {
      id: 'bg-path-a',
      routeId,
      routeLabel: 'path-a',
      profile: Sim.buildFocusProfile({}),
      active: true,
      pathProgressDist: 0,
      progressDist: 0,
      progress: 0,
      pathLength: 0,
      selectedTargetNodeId: 'gate_in_2',
      selectedTargetNodeLabel: 'gate_in_2',
      queueLocked: false,
      restState: 'none',
      restMode: null,
      reservedSeatId: null,
      position: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      tangent: { x: 1, y: 0 },
      normal: { x: 0, y: 1 },
    },
    {
      id: 'bg-path-b',
      routeId,
      routeLabel: 'path-b',
      profile: Sim.buildFocusProfile({}),
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
    },
  ];

  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundField: {
      version: 'multiterminal-path-test',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents,
      frames: [],
    },
  });

  const agentA = scenario.backgroundAgents.find((agent) => agent.id === 'bg-path-a');
  const agentB = scenario.backgroundAgents.find((agent) => agent.id === 'bg-path-b');
  assert(agentA && agentB, 'expected both synthetic background agents to exist');

  const nodeA = prepared.nodeById.gate_in_2;
  const nodeB = prepared.nodeById.gate_out_3;
  assert(nodeA && nodeB, 'expected selected terminal nodes to exist');

  assert(
    distance(agentA.path.endPoint, nodeA) < 1.2,
    `expected gate_in_2-targeted background agent path to end near gate_in_2, got ${distance(agentA.path.endPoint, nodeA).toFixed(3)}m`
  );
  assert(
    distance(agentB.path.endPoint, nodeB) < 1.2,
    `expected gate_out_3-targeted background agent path to end near gate_out_3, got ${distance(agentB.path.endPoint, nodeB).toFixed(3)}m`
  );
  assert(
    distance(agentA.path.endPoint, agentB.path.endPoint) > 4,
    'expected different selected terminal nodes to produce different background path endpoints'
  );
}

main();
console.log('validate_background_multiterminal_path_assignment: ok');
