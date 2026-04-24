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
  const presetIds = Sim.FOCUS_ROUTE_PRESETS.map((preset) => preset.id);
  const preparedPresetIds = prepared.focusRoutePresets.map((preset) => preset.id);

  assert.deepStrictEqual(
    preparedPresetIds,
    presetIds,
    'all declared focus route presets should resolve to actual prepared routes'
  );

  const route2Scenario = Sim.createScenario(prepared, {
    crowdPresetId: prepared.crowdPresets[0].id,
    focusProfile: {},
    focusRouteId: 'route2',
  });

  assert.strictEqual(route2Scenario.focusRoutePreset?.id, 'route2', 'route2 should keep its own preset id');
  assert.strictEqual(route2Scenario.focusAgent.routeId, route2Scenario.focusRoute.routeId || route2Scenario.focusRoute.id, 'focus agent should use the resolved route2 route');
  assert(
    String(route2Scenario.focusRoute.id || '').includes('es_up_1_top'),
    'route2 should start from es_up_1_top'
  );
  assert(
    (route2Scenario.focusRoute.endNodeIds || []).includes('gate_out_1'),
    'route2 should end at the Exit A group containing gate_out_1'
  );
}

main();
console.log('validate_focus_route_presets: ok');
