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

  scenario.backgroundRoutePool = [agent.route];
  agent.active = false;
  agent.respawnTimer = 0;
  agent.pathProgressDist = Math.max(0, (agent.path?.length || 0) - 0.25);
  agent.progressDist = agent.pathProgressDist;

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  assert(
    Number(agent.pathProgressDist || 0) > 1.4 && Number(agent.pathProgressDist || 0) < 5,
    `background agent should restart slightly beyond the route origin instead of stacking exactly on the spawn node, got progress ${agent.pathProgressDist}`
  );
}

main();
console.log('validate_background_respawn_start: ok');
