const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { runHeatmapSimulation } = require('../server/heatmap-runner.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function main() {
  const simData = readJson(path.join(PROJECT_ROOT, 'data', 'default-sim.json'));
  const healthyAgents = readJson(path.join(PROJECT_ROOT, 'data', 'healthy-agents.json'));
  const mutatedSimData = {
    ...simData,
    nodes: simData.nodes.map((node) => {
      if (node.id !== 'gate_in_2') {
        return { ...node };
      }
      return {
        ...node,
        id: 'gate_in_2_custom_only',
        label: 'gate_in_2_custom_only',
        attributes: {
          ...(node.attributes || {}),
          name: 'gate_in_2_custom_only',
        },
      };
    }),
  };
  const payload = {
    simData: mutatedSimData,
    healthyAgents,
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 100,
      startPoint: { x: 12.4, y: 34.414 },
      targetRegionId: 'kdt',
      focusProfile: {},
    },
    heatOptions: {
      warmupSeconds: 2,
      warmupDt: 0.25,
      maxSimulationSeconds: 6,
      frameStepSeconds: 0.5,
    },
  };

  const result = await runHeatmapSimulation(payload, { rootDir: PROJECT_ROOT });
  assert(result?.heat?.backgroundField, 'custom route heatmap run should still return background playback');
  assert(Array.isArray(result.heat.traceSnapshots), 'custom route heatmap run should produce playback snapshots');
}

main()
  .then(() => {
    console.log('validate_background_field_custom_route: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
