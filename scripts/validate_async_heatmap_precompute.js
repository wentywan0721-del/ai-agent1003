const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  coreSource.includes('function finalizeScenarioPostProcess'),
  'core should expose a shared scenario post-process finalizer'
);

assert(
  coreSource.includes('deferPostProcess'),
  'stepScenario should support skipping expensive post-process work during batch precompute'
);

assert(
  coreSource.includes('async function precomputeHeatPlaybackAsync'),
  'core should provide an async chunked heat playback precompute entrypoint'
);

assert(
  appSource.includes('fetchLocalHeatmapPlayback'),
  'app should try the local Node heatmap service before falling back to browser-side precompute'
);

assert(
  appSource.includes('precomputeHeatmapPlaybackInBrowser'),
  'app should still keep a browser-side async fallback precompute path'
);

assert(
  appSource.includes('Sim.precomputeHeatPlaybackAsync'),
  'browser fallback should still use the async precompute entrypoint instead of blocking synchronously'
);

assert(
  appSource.includes('heatmapComputing'),
  'app state should track when heatmap precompute is in progress'
);

console.log('validate_async_heatmap_precompute: ok');
