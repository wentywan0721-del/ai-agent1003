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
    backgroundCrowdCount: 1500,
    seed: 1,
  });

  const suspiciousNodes = ['gate_out_1', 'es_up_5_top', 'es_up_7_top'];
  const offenders = suspiciousNodes
    .map((nodeId) => {
      const node = prepared.nodeById?.[nodeId];
      const nearbyAgents = (scenario.backgroundAgents || []).filter((agent) => (
        agent?.active
        && node
        && Sim.distance(agent.position, node) <= 4
      ));
      if (!nearbyAgents.length) {
        return { nodeId, nearbyCount: 0, narrowSide: 0 };
      }
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      nearbyAgents.forEach((agent) => {
        minX = Math.min(minX, agent.position.x);
        maxX = Math.max(maxX, agent.position.x);
        minY = Math.min(minY, agent.position.y);
        maxY = Math.max(maxY, agent.position.y);
      });
      return {
        nodeId,
        nearbyCount: nearbyAgents.length,
        narrowSide: Math.min(maxX - minX, maxY - minY),
      };
    })
    .filter((item) => item.nearbyCount > 18 && item.narrowSide < 3);

  assert.strictEqual(
    offenders.length,
    0,
    `initial background placement should not form narrow queue-like clusters around ordinary nodes, offenders: ${JSON.stringify(offenders)}`
  );
}

main();
console.log('validate_background_initial_node_clearance: ok');
