const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const interpolatedPlaybackCount = getInterpolatedBackgroundPlaybackAgents\(\)\.length;/.test(appJs),
  'Expected dynamic summary to read simultaneous background occupancy from the current interpolated playback agents'
);

assert(
  /Math\.max\(0, interpolatedPlaybackCount \|\| renderableBackgroundCount \|\| fallbackBackgroundCount\)/.test(appJs),
  'Expected dynamic summary to prefer interpolated playback count before falling back to cached background agents'
);

console.log('validate_visualization_playback_sampled_count: ok');
