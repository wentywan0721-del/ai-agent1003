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
    seed: 20260421,
  });
  const agent = scenario.backgroundAgents[0];
  assert(agent, 'expected a background agent');

  scenario.backgroundRoutePool = [agent.route];

  const respawnProgresses = [];
  for (let index = 0; index < 3; index += 1) {
    agent.active = false;
    agent.respawnTimer = 0;
    agent.pathProgressDist = Math.max(0, (agent.path?.length || 0) - 0.2);
    agent.progressDist = agent.pathProgressDist;
    Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });
    respawnProgresses.push(Number(agent.pathProgressDist || 0));
  }

  const rounded = respawnProgresses.map((value) => Number(value.toFixed(3)));
  assert(
    new Set(rounded).size > 1,
    `background respawn progress should reshuffle across laps so spawn packs do not reform at the exact same node offsets, got ${rounded.join(', ')}`
  );
}

main();
console.log('validate_background_respawn_progress_variation: ok');
