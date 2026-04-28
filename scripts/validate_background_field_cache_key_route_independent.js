const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  buildBackgroundFieldFingerprint,
} = require('../server/heatmap-runner.js');
const { buildHeatmapCacheKey } = require('../server/heatmap-cache.js');

const simData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', '111.sim.json'), 'utf8'));

const basePayload = {
  simData,
  healthyAgents: [],
  scenarioOptions: {
    crowdPresetId: 'normal',
    backgroundCrowdCount: 1000,
    startPoint: { x: 104.19, y: 3, z: 10.5 },
    targetRegionId: 'exit_a',
    focusProfile: {
      capacityScores: {
        locomotor: 2,
        sensory: 5,
        cognitive: 5,
        psychological: 5,
        vitality: 1,
      },
    },
  },
  heatOptions: {
    maxSimulationSeconds: 120,
  },
};

const changedFocusPayload = {
  ...basePayload,
  scenarioOptions: {
    ...basePayload.scenarioOptions,
    startPoint: { x: 12.4, y: 34.414, z: 10.5 },
    targetRegionId: 'twl',
    focusProfile: {
      capacityScores: {
        locomotor: 5,
        sensory: 1,
        cognitive: 2,
        psychological: 4,
        vitality: 3,
      },
    },
  },
  heatOptions: {
    maxSimulationSeconds: 960,
  },
};

const firstKey = buildHeatmapCacheKey(buildBackgroundFieldFingerprint(basePayload));
const secondKey = buildHeatmapCacheKey(buildBackgroundFieldFingerprint(changedFocusPayload));

assert.strictEqual(
  firstKey,
  secondKey,
  'same model and same 1000-person bucket should reuse one background field despite route, focus profile, and focus budget changes'
);

console.log('validate_background_field_cache_key_route_independent: ok');
