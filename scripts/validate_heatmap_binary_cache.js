const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildHeatmapCacheKey,
  getHeatmapBinaryCacheFilePath,
  getHeatmapCacheFilePath,
  readHeatmapCache,
  writeHeatmapCache,
} = require('../server/heatmap-cache.js');

const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-binary-cache-'));
const cacheKey = buildHeatmapCacheKey({ kind: 'binary-cache-validation', version: 1 });
const payload = {
  meta: { engineVersion: 'test', backgroundFieldEngineVersion: 'test-bg' },
  backgroundField: {
    duration: 12,
    frames: [
      { time: 0, agents: [{ id: 'a', active: true, position: { x: 1, y: 2 } }] },
      { time: 1, agents: [{ id: 'a', active: true, position: { x: 2, y: 3 } }] },
    ],
    densityFrames: [
      { time: 0, occupiedCellIndices: [1, 2], occupiedCellCounts: [1, 3] },
    ],
  },
};

const writtenPath = writeHeatmapCache(cacheDir, cacheKey, payload);
assert.strictEqual(writtenPath, getHeatmapBinaryCacheFilePath(cacheDir, cacheKey), 'new cache writes should use binary cache files');
assert(fs.existsSync(getHeatmapBinaryCacheFilePath(cacheDir, cacheKey)), 'binary cache file should exist');
assert(!fs.existsSync(getHeatmapCacheFilePath(cacheDir, cacheKey)), 'new binary cache writes should not duplicate huge json cache files');
assert.deepStrictEqual(readHeatmapCache(cacheDir, cacheKey), payload, 'binary cache should round-trip payloads');

const legacyKey = buildHeatmapCacheKey({ kind: 'legacy-json-cache-validation', version: 1 });
fs.writeFileSync(getHeatmapCacheFilePath(cacheDir, legacyKey), JSON.stringify(payload), 'utf8');
assert.deepStrictEqual(readHeatmapCache(cacheDir, legacyKey), payload, 'legacy json cache fallback should remain readable');

const corruptKey = buildHeatmapCacheKey({ kind: 'corrupt-binary-cache-validation', version: 1 });
fs.writeFileSync(getHeatmapBinaryCacheFilePath(cacheDir, corruptKey), Buffer.from('not-a-valid-cache', 'utf8'));
fs.writeFileSync(getHeatmapCacheFilePath(cacheDir, corruptKey), JSON.stringify(payload), 'utf8');
assert.deepStrictEqual(readHeatmapCache(cacheDir, corruptKey), payload, 'corrupt binary cache should fall back to legacy json when available');

console.log('validate_heatmap_binary_cache: ok');
