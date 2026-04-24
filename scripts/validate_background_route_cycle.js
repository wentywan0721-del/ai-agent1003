const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function main() {
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    backgroundCrowdCount: 2,
    focusProfile: {},
    seed: 20260328,
  });
  const agent = scenario.backgroundAgents[0];
  assert(agent, 'expected a background agent');
  const originalRouteId = agent.routeId;
  const alternativeRoute = prepared.odRoutes.find((route) => route.id !== originalRouteId);
  assert(alternativeRoute, 'expected an alternative route');

  scenario.backgroundRoutePool = [alternativeRoute];
  agent.active = false;
  agent.respawnTimer = 0;

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  assert.strictEqual(
    agent.routeId,
    originalRouteId,
    'background agent should keep the same route when completing one trip and starting the next cycle'
  );
}

main();
console.log('validate_background_route_cycle: ok');
