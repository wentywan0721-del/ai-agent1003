const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');

function main() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));
  const prepared = Sim.prepareSimData(raw);
  const startNode = prepared.nodeById.train_door_1;
  assert(startNode, 'Expected train_door_1 to exist in the sample model');

  const scenario = Sim.createScenario(prepared, {
    crowdPresetId: 'normal',
    backgroundCrowdCount: 1,
    startPoint: { x: startNode.x, y: startNode.y, z: startNode.z || 0 },
    targetRegionId: 'exit_a',
    focusProfile: {
      capacityScores: {
        vitality: 1,
        locomotor: 2,
        sensory: 5,
        cognitive: 5,
        psychological: 5,
      },
    },
    seed: 20260426,
  });

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 120,
    maxExtendedSimulationSeconds: 960,
    precomputeStepSeconds: 0.72,
  });
  const snapshots = playback.traceSnapshots || [];
  const last = snapshots[snapshots.length - 1] || {};

  assert(
    playback.duration > 120,
    `Low-capacity long routes should extend beyond the 120s base budget; got duration ${playback.duration}`
  );
  assert(
    Number(last.progress) >= 0.999,
    `Playback should include a final completed snapshot; got progress ${last.progress}`
  );
  assert.strictEqual(
    last.playbackComplete,
    true,
    'Final playback snapshot should be explicitly marked complete'
  );
}

main();
console.log('validate_low_capacity_long_route_playback_completion: ok');
