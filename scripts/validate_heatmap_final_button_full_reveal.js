const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function handleHeatmapDisplayModeToggle\(\) \{[\s\S]*const playback = getActivePlayback\(\);[\s\S]*const endTime = Number\(playback\?\.endTime\);[\s\S]*lockHeatmapRevealAt\(Number\.isFinite\(endTime\) \? endTime : getCurrentHeatmapRevealTime\(playback\)\);/.test(appJs),
  'Expected final heatmap button to reveal the full heatmap by locking to playback endTime'
);

console.log('validate_heatmap_final_button_full_reveal: ok');
