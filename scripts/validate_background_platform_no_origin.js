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
    focusRouteId: 'route1',
    focusProfile: {},
    backgroundCrowdCount: 200,
  });

  const hasDoorOriginRoute = scenario.backgroundRoutePool.some((route) => (
    String(route.family || '').startsWith('train_door_to_')
    || String(route.startGroupId || '').startsWith('train_door')
    || (Array.isArray(route.startNodeIds) && route.startNodeIds.some((nodeId) => String(nodeId || '').startsWith('train_door')))
  ));

  assert.strictEqual(hasDoorOriginRoute, false, 'expected background route pool to exclude train-door origin routes');
  assert.strictEqual(
    scenario.backgroundAgents.some((agent) => String(agent.routeId || '').startsWith('train_door_to_')),
    false,
    'expected initial background agents to avoid spawning from train doors'
  );
}

main();
console.log('validate_background_platform_no_origin: ok');
