const assert = require('assert');
const path = require('path');

const {
  buildHeatmapRequestFingerprint,
  buildBackgroundFieldFingerprint,
} = require('../server/heatmap-runner.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function createPayload(overrides = {}) {
  const base = {
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount: 100,
      focusRouteId: 'route1',
      focusProfile: {
        capacityScores: {
          locomotor: 3,
          sensory: 3,
          cognitive: 3,
          psychological: 3,
          vitality: 3,
        },
      },
    },
    heatOptions: {
      warmupSeconds: 6,
      warmupDt: 0.25,
      maxSimulationSeconds: 8,
    },
  };
  return {
    ...base,
    ...overrides,
    scenarioOptions: {
      ...base.scenarioOptions,
      ...(overrides.scenarioOptions || {}),
    },
    heatOptions: {
      ...base.heatOptions,
      ...(overrides.heatOptions || {}),
    },
  };
}

function main() {
  const payloadA = createPayload({
    scenarioOptions: {
      focusRouteId: 'route1',
      focusProfile: {
        capacityScores: {
          locomotor: 2,
          sensory: 4,
          cognitive: 3,
          psychological: 2,
          vitality: 1,
        },
      },
    },
  });
  const payloadB = createPayload({
    scenarioOptions: {
      focusRouteId: 'route3',
      focusProfile: {
        capacityScores: {
          locomotor: 5,
          sensory: 1,
          cognitive: 4,
          psychological: 5,
          vitality: 4,
        },
      },
    },
  });
  const payloadC = createPayload({
    scenarioOptions: {
      backgroundCrowdCount: 300,
    },
  });

  const fullA = buildHeatmapRequestFingerprint(payloadA, { rootDir: PROJECT_ROOT });
  const fullB = buildHeatmapRequestFingerprint(payloadB, { rootDir: PROJECT_ROOT });
  assert.notDeepStrictEqual(fullA, fullB, 'full heatmap fingerprint should change with focus route/profile');

  const backgroundA = buildBackgroundFieldFingerprint(payloadA, { rootDir: PROJECT_ROOT });
  const backgroundB = buildBackgroundFieldFingerprint(payloadB, { rootDir: PROJECT_ROOT });
  assert.deepStrictEqual(backgroundA, backgroundB, 'background field fingerprint should ignore focus route/profile');

  const backgroundC = buildBackgroundFieldFingerprint(payloadC, { rootDir: PROJECT_ROOT });
  assert.notDeepStrictEqual(backgroundA, backgroundC, 'background field fingerprint should change with background crowd settings');

  console.log('validate_background_field_cache_key: ok');
}

main();
