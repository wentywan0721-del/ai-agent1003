const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function isUsableLocalHeatmapPlaybackCacheEntry\(/.test(appJs),
  'Expected a session-level usable heatmap cache gate for replaying already computed preview/final results'
);

assert(
  /return isUsableLocalHeatmapPlaybackCacheEntry\(cached\) \? cloneJson\(cached\) : null;/.test(appJs),
  'Expected in-memory heatmap cache reads to accept usable computed playback, not only final refined playback'
);

assert(
  /writeLocalHeatmapPlaybackCache\(cacheKey, normalizedPlayback\)/.test(appJs)
  && /writeLocalHeatmapPlaybackCache\(cacheKey, resolvedPlayback\)/.test(appJs),
  'Expected completed local-service heatmap results to be written into the session cache'
);

assert(
  /writePersistentLocalHeatmapPlaybackCache\(cacheKey, playback\)[\s\S]*isStableLocalHeatmapPlaybackCacheEntry/.test(appJs),
  'Expected persistent cache to remain stricter than the session cache'
);

console.log('validate_heatmap_session_usable_cache: ok');
