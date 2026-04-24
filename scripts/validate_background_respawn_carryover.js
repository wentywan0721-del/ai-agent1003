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
    seed: 20260417,
  });
  const agent = scenario.backgroundAgents[0];
  assert(agent, 'expected a background agent');

  agent.active = false;
  agent.respawnTimer = 0;

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  assert(agent.active, 'expected respawned background agent to become active immediately');
  assert(Number(agent.pathProgressDist || 0) > 0.01, `expected respawned background agent to move during the same step, got progress ${agent.pathProgressDist}`);
  assert(agent.justRespawned === false, 'expected respawned background agent to clear justRespawned after the same-step movement');
}

main();
console.log('validate_background_respawn_carryover: ok');
