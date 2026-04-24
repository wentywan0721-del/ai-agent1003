const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

function readHeatmapCache(cacheDir, cacheKey) {
  const filePath = getHeatmapCacheFilePath(cacheDir, cacheKey);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeHeatmapCache(cacheDir, cacheKey, result) {
  const filePath = getHeatmapCacheFilePath(cacheDir, cacheKey);
  const tempFilePath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempFilePath, JSON.stringify(result), 'utf8');
  fs.renameSync(tempFilePath, filePath);
  return filePath;
}

module.exports = {
  stableStringify,
  ensureCacheDir,
  buildHeatmapCacheKey,
  getHeatmapCacheFilePath,
  readHeatmapCache,
  writeHeatmapCache,
};
