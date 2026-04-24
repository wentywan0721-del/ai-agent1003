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
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: prepared.focusRoutePresets[0].id,
    focusProfile: {},
    backgroundCrowdCount: 1500,
    seed: 1,
  });

  assert(
    !scenario.backgroundRoutePool.some((route) => route.id === 'twl_up_to_gate_out__es_up_8_top__exit_b'),
    'ultra-short background routes should be filtered out of the live route pool so they do not form static node clusters'
  );

  assert(
    !scenario.backgroundAgents.some((agent) => agent.routeId === 'twl_up_to_gate_out__es_up_8_top__exit_b'),
    'background agents should no longer be seeded onto the ultra-short exit-b loop route'
  );
}

main();
console.log('validate_background_short_route_pool_filter: ok');
