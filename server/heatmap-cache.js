const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const v8 = require('v8');

const BINARY_CACHE_MAGIC = Buffer.from('PLANAR_HEATMAP_CACHE_V1\0', 'utf8');

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function ensureCacheDir(cacheDir) {
  fs.mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

function buildHeatmapCacheKey(payload) {
  return crypto
    .createHash('sha256')
    .update(stableStringify(payload))
    .digest('hex');
}

function getHeatmapCacheFilePath(cacheDir, cacheKey) {
  return path.join(ensureCacheDir(cacheDir), `${cacheKey}.json`);
}

function getHeatmapBinaryCacheFilePath(cacheDir, cacheKey) {
  return path.join(ensureCacheDir(cacheDir), `${cacheKey}.bin`);
}

function readBinaryCacheFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < BINARY_CACHE_MAGIC.length || !buffer.subarray(0, BINARY_CACHE_MAGIC.length).equals(BINARY_CACHE_MAGIC)) {
    return null;
  }
  return v8.deserialize(buffer.subarray(BINARY_CACHE_MAGIC.length));
}

function writeBinaryCacheFile(filePath, result) {
  const payload = Buffer.concat([BINARY_CACHE_MAGIC, v8.serialize(result)]);
  fs.writeFileSync(filePath, payload);
}

function readHeatmapCache(cacheDir, cacheKey) {
  const binaryFilePath = getHeatmapBinaryCacheFilePath(cacheDir, cacheKey);
  if (fs.existsSync(binaryFilePath)) {
    try {
      const binaryResult = readBinaryCacheFile(binaryFilePath);
      if (binaryResult) {
        return binaryResult;
      }
    } catch (error) {
      // Fall through to the legacy JSON cache if a binary write was interrupted or corrupted.
    }
  }
  const filePath = getHeatmapCacheFilePath(cacheDir, cacheKey);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeHeatmapCache(cacheDir, cacheKey, result) {
  const filePath = getHeatmapBinaryCacheFilePath(cacheDir, cacheKey);
  const tempFilePath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  writeBinaryCacheFile(tempFilePath, result);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  fs.renameSync(tempFilePath, filePath);
  const legacyFilePath = getHeatmapCacheFilePath(cacheDir, cacheKey);
  if (fs.existsSync(legacyFilePath)) {
    fs.unlinkSync(legacyFilePath);
  }
  return filePath;
}

module.exports = {
  stableStringify,
  ensureCacheDir,
  buildHeatmapCacheKey,
  getHeatmapBinaryCacheFilePath,
  getHeatmapCacheFilePath,
  readHeatmapCache,
  writeHeatmapCache,
};
