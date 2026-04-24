const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  const prepared = loadPrepared();
  const routeId = 'twl_up_to_gate_out__es_up_8_top__exit_b';
  const profile = Sim.buildFocusProfile({});

  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: prepared.focusRoutePresets[0].id,
    focusProfile: {},
    backgroundField: {
      version: 'short-route-spawn-check',
      initialTime: 0,
      initialSeatOccupancy: {},
      initialAgents: [
        {
          id: 'synthetic-short-route',
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
        },
      ],
      frames: [],
    },
  });

  scenario.backgroundField = null;
  scenario.backgroundFieldActive = false;
  scenario.backgroundFieldCursor = 0;

  const agent = scenario.backgroundAgents.find((item) => item.routeId === routeId);
  assert(agent, `expected a background agent on ${routeId}`);

  const ratios = [];
  for (let index = 0; index < 3; index += 1) {
    agent.active = false;
    agent.respawnTimer = 0;
    agent.pathProgressDist = Math.max(0, (agent.path?.length || 0) - 0.12);
    agent.progressDist = agent.pathProgressDist;
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });
    ratios.push(Number(agent.pathProgressDist || 0) / Math.max(1e-6, Number(agent.pathLength || 0)));
  }

  assert(
    ratios.every((ratio) => ratio < 0.35),
    `short background routes should respawn close to the origin side instead of reforming near the terminal, got ratios ${ratios.map((value) => value.toFixed(3)).join(', ')}`
  );
}

main();
console.log('validate_background_short_route_spawn_not_near_terminal: ok');
