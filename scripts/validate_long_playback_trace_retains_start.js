const assert = require('assert');

const Sim = require('../src/core.js');

function createLongCorridorPrepared() {
  return Sim.prepareSimData({
    walkableAreas: [
      [
        [0, -10],
        [1100, -10],
        [1100, 10],
        [0, 10],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 0, y: 0 },
      { id: 'es_down_1_top', x: 1000, y: 0 },
    ],
    pressureObjects: [],
    seats: [],
  }, {
    healthyAgents: [],
  });
}

function main() {
  const prepared = createLongCorridorPrepared();
  const scenario = Sim.createScenario(prepared, {
    backgroundCrowdCount: 1,
    startPoint: { x: 0, y: 0, z: 0 },
    targetRegionId: 'kdt',
    focusProfile: {
      capacityScores: {
        locomotor: 5,
        sensory: 5,
        cognitive: 5,
        psychological: 5,
        vitality: 5,
      },
    },
    seed: 1,
  });

  const playback = Sim.precomputeHeatPlayback(prepared, scenario, {
    maxSimulationSeconds: 480,
  });
  const snapshots = playback.traceSnapshots || [];
  const first = snapshots[0];

  assert(snapshots.length > 0, 'expected long-route playback to contain snapshots');
  assert.strictEqual(Number(playback.startTime || 0), 0, 'expected long-route playback startTime to remain at 0');
  assert.strictEqual(Number(first?.time || 0), 0, 'expected the first long-route snapshot time to remain at 0');
  assert(Math.abs(Number(first?.x || 0)) <= 1e-6, 'expected the first long-route snapshot x to remain at the selected start point');
  assert(Math.abs(Number(first?.y || 0)) <= 1e-6, 'expected the first long-route snapshot y to remain at the selected start point');
}

main();
console.log('validate_long_playback_trace_retains_start: ok');
