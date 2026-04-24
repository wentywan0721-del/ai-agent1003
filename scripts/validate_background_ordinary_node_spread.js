const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'default-sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function computeSpread(points) {
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  });
  return {
    width: maxX - minX,
    height: maxY - minY,
    narrowSide: Math.min(maxX - minX, maxY - minY),
  };
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
      const nearbyPoints = (scenario.backgroundAgents || [])
        .filter((agent) => agent?.active && node && Sim.distance(agent.position, node) <= 4)
        .map((agent) => agent.position);
      if (nearbyPoints.length < 12) {
        return null;
      }
      const spread = computeSpread(nearbyPoints);
      return {
        nodeId,
        nearbyCount: nearbyPoints.length,
        width: Number(spread.width.toFixed(2)),
        height: Number(spread.height.toFixed(2)),
        narrowSide: Number(spread.narrowSide.toFixed(2)),
      };
    })
    .filter((item) => item && item.narrowSide < 3);

  assert.strictEqual(
    offenders.length,
    0,
    `ordinary node crowd should spread in 2D instead of a thin queue band, offenders: ${JSON.stringify(offenders)}`
  );
}

main();
console.log('validate_background_ordinary_node_spread: ok');
