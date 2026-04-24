const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function isExplicitQueueNodeId(nodeId) {
  return /^train_door_?\d+$/i.test(String(nodeId || '')) || String(nodeId || '') === 'elev_3';
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

  const offenders = scenario.backgroundAgents
    .filter((agent) => agent && agent.active && !isExplicitQueueNodeId(agent.selectedTargetNodeId))
    .filter((agent) => {
      const pathLength = Number(agent.pathLength || agent.path?.length || 0);
      const remaining = Math.max(0, pathLength - Number(agent.pathProgressDist || agent.progressDist || 0));
      return remaining < 1.6;
    })
    .slice(0, 12)
    .map((agent) => ({
      id: agent.id,
      routeId: agent.routeId,
      target: agent.selectedTargetNodeId,
      progress: Number((agent.progress || 0).toFixed(3)),
      remaining: Number((Math.max(0, Number(agent.pathLength || 0) - Number(agent.pathProgressDist || 0))).toFixed(3)),
    }));

  assert.strictEqual(
    offenders.length,
    0,
    `background agents should not be initially seeded inside the terminal clearance zone for non-queue nodes, offenders: ${JSON.stringify(offenders)}`
  );
}

main();
console.log('validate_background_initial_nonqueue_terminal_clearance: ok');
