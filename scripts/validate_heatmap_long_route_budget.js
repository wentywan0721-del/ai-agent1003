const assert = require('assert');

const { runHeatmapSimulation } = require('../server/heatmap-runner.js');

function createBackgroundFieldStub() {
  return {
    version: 'background-field-test',
    initialTime: 0,
    initialSeatOccupancy: {},
    initialAgents: [],
    frames: [
      {
        time: 0,
        seatOccupancy: {},
        agents: [],
      },
    ],
  };
}

async function main() {
  const simData = {
    walkableAreas: [
      [
        [0, -10],
        [300, -10],
        [300, 10],
        [0, 10],
      ],
    ],
    obstacles: [],
    nodes: [
      { id: 'gate_in_1', x: 0, y: 0 },
      { id: 'es_down_1_top', x: 200, y: 0 },
    ],
    pressureObjects: [],
    seats: [],
  };

  const result = await runHeatmapSimulation({
    simData,
    healthyAgents: [],
    scenarioOptions: {
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
    },
    heatOptions: {
      warmupSeconds: 0,
      warmupDt: 0.25,
      maxSimulationSeconds: 120,
    },
  }, {
    rootDir: process.cwd(),
    backgroundField: createBackgroundFieldStub(),
  });

  const snapshots = result?.heat?.traceSnapshots || [];
  const last = snapshots[snapshots.length - 1];

  assert(snapshots.length > 0, 'expected long-route heatmap playback to contain snapshots');
  assert(Number(last?.progress || 0) >= 0.999, 'expected local heatmap playback budget to carry the focus route to completion');
  assert(Number(result?.heat?.endTime || 0) > 120, 'expected the server-side heatmap budget to extend beyond the caller minimum for long routes');
}

main()
  .then(() => {
    console.log('validate_heatmap_long_route_budget: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
