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

  const field = Sim.precomputeBackgroundField(prepared, scenario, {
    maxSimulationSeconds: 40,
    frameStepSeconds: 0.12,
  });

  const offenders = [];
  (field.frames || []).forEach((frame) => {
    (frame.agents || []).forEach((agent) => {
      const visibleQueueState = agent?.backgroundState === 'queueing' || agent?.backgroundState === 'riding';
      if (!visibleQueueState) {
        return;
      }
      if (isExplicitQueueNodeId(agent.queueTargetNodeId)) {
        return;
      }
      offenders.push({
        time: Number(frame.time || 0).toFixed(2),
        id: agent.id,
        state: agent.backgroundState,
        queueTargetNodeId: agent.queueTargetNodeId || null,
      });
    });
  });

  assert.strictEqual(
    offenders.length,
    0,
    `only platform boarding points and elevator may enter visible queue states, offenders: ${JSON.stringify(offenders.slice(0, 12))}`
  );
}

main();
console.log('validate_background_only_explicit_queue_nodes: ok');
