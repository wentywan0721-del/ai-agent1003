const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  appJs.includes('heatmapRevealLocked'),
  'Expected dedicated heatmap reveal lock state'
);

assert(
  appJs.includes('heatmapRevealFrozenTime'),
  'Expected frozen reveal time state for one-way final heatmap display'
);

assert(
  /function resetHeatmapPlaybackDisplayState\(\)/.test(appJs),
  'Expected a helper that resets playback heatmap display state before each run'
);

assert(
  /function lockHeatmapRevealAt\(time\)/.test(appJs),
  'Expected a helper that locks the heatmap reveal at a fixed playback time'
);

assert(
  /function handleHeatmapDisplayModeToggle\(\) \{[\s\S]*const playback = getActivePlayback\(\);[\s\S]*lockHeatmapRevealAt\(/.test(appJs),
  'Expected final heatmap button to lock reveal from the active playback state'
);

assert(
  /elements\.showFinalHeatmapBtn\.disabled = !state\.scenario\?\.heatActive \|\| controlsLocked \|\| state\.heatmapRevealLocked;/.test(appJs),
  'Expected final heatmap button to disable after being locked'
);

console.log('validate_heatmap_progressive_reveal_mode: ok');
