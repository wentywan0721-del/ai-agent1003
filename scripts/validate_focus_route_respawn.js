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
  prepared.focusRoutePresets.forEach((preset) => {
    const scenario = Sim.createScenario(prepared, {
      focusProfile: {},
      crowdPresetId: prepared.crowdPresets[0].id,
      focusRouteId: preset.id,
    });
    assert(
      scenario.focusTargetRegionId,
      `preset focus route ${preset.id} should derive a target region for later respawn`
    );
    assert(
      scenario.focusTargetRegion,
      `preset focus route ${preset.id} should keep a target region object for later respawn`
    );

    const focusAgent = scenario.focusAgent;
    focusAgent.pathProgressDist = focusAgent.path.length;
    focusAgent.progressDist = focusAgent.path.length;
    focusAgent.active = false;
    focusAgent.respawnTimer = 0;

    assert.doesNotThrow(() => {
      Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true });
    }, `preset focus route ${preset.id} should respawn cleanly after reaching the end`);

    assert(focusAgent.active, `focus agent for preset ${preset.id} should be active again after respawn`);
    assert(
      scenario.focusTargetRegionId,
      `preset focus route ${preset.id} should still have a target region after respawn`
    );
  });
}

main();
console.log('validate_focus_route_respawn: ok');
