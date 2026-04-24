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

  const field = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 20,
    frameStepSeconds: 0.12,
  });

  const suspiciousNodeIds = ['gate_out_1', 'es_up_5_top', 'es_up_6_top', 'es_up_7_top', 'es_down_1_top'];
  const offenders = [];

  suspiciousNodeIds.forEach((nodeId) => {
    const node = prepared.nodeById[nodeId];
    const streaks = new Map();
    (field.frames || []).forEach((frame) => {
      (frame.agents || []).forEach((agent) => {
        const previous = streaks.get(agent.id) || { current: 0, max: 0, target: agent.selectedTargetNodeId || null };
        const near = agent.active && Sim.distance(agent.position, node) <= 2.2;
        if (near) {
          previous.current += 1;
          previous.max = Math.max(previous.max, previous.current);
        } else {
          previous.current = 0;
        }
        previous.target = agent.selectedTargetNodeId || previous.target;
        streaks.set(agent.id, previous);
      });
    });

    Array.from(streaks.entries())
      .filter(([, info]) => info.max > 12 && info.target !== nodeId)
      .slice(0, 8)
      .forEach(([id, info]) => {
        offenders.push({
          nodeId,
          id,
          target: info.target,
          maxFrames: info.max,
          seconds: Number((info.max * 0.12).toFixed(2)),
        });
      });
  });

  assert.strictEqual(
    offenders.length,
    0,
    `moving background riders should not visually linger around ordinary nodes like fake queues, offenders: ${JSON.stringify(offenders.slice(0, 12))}`
  );
}

main();
console.log('validate_background_nonqueue_node_visual_detour: ok');
