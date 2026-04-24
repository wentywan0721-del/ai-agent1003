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

  const groups = new Map();
  scenario.backgroundAgents.forEach((agent) => {
    const key = `${agent.routeId}::${agent.selectedTargetNodeId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(agent);
  });

  const offenders = [];
  groups.forEach((agents, key) => {
    if (agents.length < 8) {
      return;
    }
    const remainingDistances = agents.map((agent) => Math.max(
      0,
      Number(agent.pathLength || agent.path?.length || 0) - Number(agent.pathProgressDist || agent.progressDist || 0)
    ));
    const minRemaining = Math.min(...remainingDistances);
    const nearMinCount = remainingDistances.filter((value) => Math.abs(value - minRemaining) <= 0.03).length;
    if (nearMinCount > 3) {
      offenders.push({
        key,
        count: agents.length,
        minRemaining: Number(minRemaining.toFixed(3)),
        nearMinCount,
      });
    }
  });

  assert.strictEqual(
    offenders.length,
    0,
    `background initial seeding should not collapse multiple riders onto the same route boundary, offenders: ${JSON.stringify(offenders.slice(0, 12))}`
  );
}

main();
console.log('validate_background_initial_progress_distribution: ok');
