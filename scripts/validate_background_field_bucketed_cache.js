const assert = require('assert');
const path = require('path');

const {
  buildBackgroundFieldFingerprint,
  resolveBackgroundFieldBucketCrowdCount,
} = require('../server/heatmap-runner.js');
const { buildHeatmapCacheKey } = require('../server/heatmap-cache.js');

const PROJECT_ROOT = path.join(__dirname, '..');

function createPayload(backgroundCrowdCount) {
  return {
    scenarioOptions: {
      crowdPresetId: 'normal',
      backgroundCrowdCount,
      startPoint: { x: 12.4, y: 34.414, z: 0 },
      startNodeId: 'gate_in_1',
      targetRegionId: 'exit_a',
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
      maxSimulationSeconds: 60,
    },
  };
}

function main() {
  assert.strictEqual(
    typeof resolveBackgroundFieldBucketCrowdCount,
    'function',
    'heatmap runner should expose background crowd bucket resolution'
  );

  assert.strictEqual(
    resolveBackgroundFieldBucketCrowdCount(1030),
    1000,
    '1030 crowd count should resolve to the 1000 background bucket'
  );
  assert.strictEqual(
    resolveBackgroundFieldBucketCrowdCount(1710),
    1500,
    '1710 crowd count should resolve to the 1500 background bucket'
  );

  const cacheKeyA = buildHeatmapCacheKey(buildBackgroundFieldFingerprint(createPayload(1000), { rootDir: PROJECT_ROOT }));
  const cacheKeyB = buildHeatmapCacheKey(buildBackgroundFieldFingerprint(createPayload(1030), { rootDir: PROJECT_ROOT }));
  const cacheKeyC = buildHeatmapCacheKey(buildBackgroundFieldFingerprint(createPayload(1710), { rootDir: PROJECT_ROOT }));

  assert.strictEqual(
    cacheKeyA,
    cacheKeyB,
    'background cache key should stay stable within the same bucket'
  );
  assert.notStrictEqual(
    cacheKeyA,
    cacheKeyC,
    'different buckets should produce different background cache keys'
  );
}

main();
console.log('validate_background_field_bucketed_cache: ok');
