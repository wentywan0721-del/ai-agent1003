const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Sim = require('../src/core.js');
const { runHeatmapSimulation } = require('../server/heatmap-runner.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  const simData = readJson(path.join(PROJECT_ROOT, 'data', 'default-sim.json'));
  const healthyAgents = readJson(path.join(PROJECT_ROOT, 'data', 'healthy-agents.json'));
  const prepared = Sim.prepareSimData(simData, { healthyAgents });
  const startNode = prepared.nodeById.gate_in_1;

  const payload = {
    simData,
    healthyAgents,
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 100,
      startPoint: { x: startNode.x, y: startNode.y, z: startNode.z },
      targetRegionId: 'kdt',
      focusProfile: {},
      seed: 20260327,
    },
    heatOptions: {
      warmupSeconds: 48,
      warmupDt: 0.25,
      maxSimulationSeconds: 120,
    },
  };

  const result = await runHeatmapSimulation(payload, { rootDir: PROJECT_ROOT });
  const snapshots = result?.heat?.traceSnapshots || [];
  assert(snapshots.length > 0, 'expected local playback to contain focus trace snapshots');
  const first = snapshots[0];

  assert.strictEqual(Number(result.heat.startTime || 0), 0, 'expected local playback to start at time 0');
  assert.strictEqual(Number(first.time || 0), 0, 'expected the first focus snapshot to be recorded at time 0');
  assert(Math.abs(Number(first.progress || 0)) <= 1e-6, 'expected the first focus snapshot progress to start at 0');
  assert(Math.abs(Number(first.x || 0) - startNode.x) <= 1e-6, 'expected the first focus snapshot x to match the selected start point');
  assert(Math.abs(Number(first.y || 0) - startNode.y) <= 1e-6, 'expected the first focus snapshot y to match the selected start point');
}

main()
  .then(() => {
    console.log('validate_local_playback_focus_start: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
