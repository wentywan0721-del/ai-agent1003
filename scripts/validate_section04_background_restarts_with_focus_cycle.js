const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getFocusCycleBackgroundSampleTime/.test(appSource),
  'Section04 playback should compute background sample time from the current focus-agent cycle'
);

assert(
  /const backgroundSampleTime = getFocusCycleBackgroundSampleTime\(playback,\s*backgroundField,\s*nextTime\);/.test(appSource),
  'advancePrecomputedPlayback should use the focus-cycle background sample time instead of raw accumulated playback time'
);

assert(
  /resolveLoopedBackgroundPlaybackFramePair\(backgroundField,\s*backgroundSampleTime/.test(appSource),
  'background frame lookup should receive the focus-cycle sample time'
);

assert(
  /sampleTime:\s*Number\(backgroundPlaybackState\.sampleTime \|\| backgroundSampleTime\)/.test(appSource),
  'render state should expose the focus-cycle background sample time for WebGL/canvas interpolation'
);

console.log('validate_section04_background_restarts_with_focus_cycle: ok');
