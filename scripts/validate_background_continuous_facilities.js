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
    backgroundCrowdCount: 30,
    focusProfile: {},
    seed: 20260401,
  });

  const agent = scenario.backgroundAgents.find((item) => String(item?.route?.endGroupId || '').includes('es_'));
  assert(agent, 'expected a background agent already assigned to an escalator route');

  agent.pathProgressDist = Math.max(0, agent.path.length - 0.6);
  agent.progressDist = agent.pathProgressDist;
  agent.backgroundState = 'moving';
  agent.queueTargetNodeId = null;
  agent.queueJoinedAt = null;
  agent.rideRemaining = 0;
  agent.active = true;

  Sim.stepScenario(prepared, scenario, 0.25, { deferPostProcess: true, skipFocusAgent: true });

  assert.notStrictEqual(
    agent.backgroundState,
    'queueing',
    'background agents reaching escalators should stay in continuous flow instead of switching to explicit queueing'
  );
  assert.notStrictEqual(
    agent.backgroundState,
    'riding',
    'background agents reaching escalators should not be held in a visible riding queue state at the entrance'
  );
}

main();
console.log('validate_background_continuous_facilities: ok');
