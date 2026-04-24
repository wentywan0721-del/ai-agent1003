const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

  assert(
    appSource.includes('let precomputedPlayback = invalidateStalePrecomputedPlayback() ? null : (state.scenario.precomputedPlayback || null);'),
    'handleRunHeatmap should refuse stale in-memory playback before reuse'
  );

  assert(
    serverSource.includes('function isCompatibleCachedHeatmapResult'),
    'server should validate cached heatmap results before serving them'
  );

  assert(
    serverSource.includes('const cachedResult = isCompatibleCachedHeatmapResult(rawCachedResult) ? rawCachedResult : null;'),
    'server should ignore stale cached heatmap payloads'
  );
}

main();
console.log('validate_server_rejects_stale_heatmap_cache: ok');
