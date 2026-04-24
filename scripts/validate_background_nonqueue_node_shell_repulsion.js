const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function loadPrepared() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const healthyAgents = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'healthy-agents.json'), 'utf8'));
  return Sim.prepareSimData(raw, { healthyAgents });
}

function countShellCluster(frame, node, minDistance, maxDistance) {
  return (frame?.agents || []).filter((agent) => {
    if (!agent?.active) {
      return false;
    }
    const nodeDistance = Sim.distance(agent.position, node);
    return nodeDistance >= minDistance && nodeDistance <= maxDistance;
  }).length;
}

function main() {
  const prepared = loadPrepared();
  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    focusRouteId: prepared.focusRoutePresets?.[0]?.id || 'route1',
    focusProfile: {},
    backgroundCrowdCount: 1500,
    seed: 1,
  });

  const field = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 15,
    frameStepSeconds: 0.54,
  });

  const frame = (field.frames || []).find((item) => Number(item.time || 0) >= 10) || field.frames?.[field.frames.length - 1];
  assert(frame, 'expected background playback field to contain sampled frames');

  const suspiciousNodes = ['gate_out_1', 'es_up_5_top', 'es_up_6_top'];
  const offenders = suspiciousNodes
    .map((nodeId) => {
      const node = prepared.nodeById?.[nodeId];
      const shellCount = node ? countShellCluster(frame, node, 2.34, 2.38) : 0;
      return { nodeId, shellCount };
    })
    .filter((item) => item.shellCount >= 4);

  assert.strictEqual(
    offenders.length,
    0,
    `non-queue nodes should not force multiple background riders into the same fixed shell radius, offenders: ${JSON.stringify(offenders)}`
  );
}

main();
console.log('validate_background_nonqueue_node_shell_repulsion: ok');
