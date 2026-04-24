const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function syncScenarioToPlaybackArtifacts\(playback = getActivePlayback\(\)\) \{[\s\S]*state\.scenario\.precomputedPlayback = playback;/.test(appJs),
  'Expected playback sync to reattach precomputedPlayback onto the active scenario'
);

assert(
  /function syncScenarioToPlaybackArtifacts\(playback = getActivePlayback\(\)\) \{[\s\S]*state\.scenario\.usePrecomputedHeatPlayback = true;/.test(appJs),
  'Expected playback sync to restore usePrecomputedHeatPlayback'
);

assert(
  /function syncScenarioToPlaybackArtifacts\(playback = getActivePlayback\(\)\) \{[\s\S]*state\.scenario\.heatActive = true;/.test(appJs),
  'Expected playback sync to force heatActive once playback exists'
);

console.log('validate_heatmap_success_state: ok');
