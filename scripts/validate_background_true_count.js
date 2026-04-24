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
  [120, 350, 700, 1500].forEach((requestedTotal) => {
    const scenario = Sim.createScenario(prepared, {
      crowdPresetId: 'normal',
      focusRouteId: 'route1',
      focusProfile: {},
      backgroundCrowdCount: requestedTotal,
    });
    const field = Sim.precomputeBackgroundField(prepared, scenario, {
      maxSimulationSeconds: requestedTotal >= 1500 ? 12 : 24,
      frameStepSeconds: requestedTotal >= 1500 ? 0.5 : 0.42,
    });
    const activeCounts = field.frames.map((frame) => (
      frame.agents.filter((agent) => agent.active).length
    ));

    assert.strictEqual(scenario.agents.length, requestedTotal, `expected scenario creation to start with exactly ${requestedTotal} total agents`);
    assert.strictEqual(field.initialAgents.length, requestedTotal - 1, `expected playback background field to start with exactly ${requestedTotal - 1} non-focus passengers`);
    assert(
      Math.abs(activeCounts[0] - (requestedTotal - 1)) <= 0,
      `expected first playback frame to start with exactly ${requestedTotal - 1} active background passengers`
    );
    assert(
      Math.max(...activeCounts) >= requestedTotal - 1,
      `expected later playback frames to keep replenishing flow around the requested crowd level for ${requestedTotal} people`
    );
  });
}

main();
console.log('validate_background_true_count: ok');
