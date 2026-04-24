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
  const startNode = prepared.nodeById.gate_out_3;
  assert(startNode, 'expected gate_out_3 in default sim');

  const scenario = Sim.createScenario(prepared, {
    startNodeId: startNode.id,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'kdt',
    backgroundCrowdCount: 1,
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 3,
        cognitive: 3,
        psychological: 3,
        vitality: 1,
      },
    },
    seed: 20260424,
  });

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 240,
    maxExtendedSimulationSeconds: 960,
    precomputeStepSeconds: 0.24,
  });

  const trace = Array.isArray(playback.traceSnapshots) ? playback.traceSnapshots : [];
  const last = trace[trace.length - 1] || null;

  assert(last, 'expected playback to contain a final focus snapshot');
  assert(
    Number(last.progress || 0) >= 0.98,
    `expected low-vitality focus playback to finish the route under the approved visibility-based rest rule, got ${(Number(last.progress || 0) * 100).toFixed(1)}%`
  );
}

main();
console.log('validate_focus_low_vitality_route_completes_after_rest: ok');
