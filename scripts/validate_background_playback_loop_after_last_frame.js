const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function resolveLoopedBackgroundPlaybackFramePair\(/.test(appJs),
  'Expected app playback to define a helper that resolves background playback frames after the precomputed frame range ends'
);

assert(
  /const backgroundPlaybackState = resolveLoopedBackgroundPlaybackFramePair\(backgroundField, nextTime, \{[\s\S]*loopStartTime: startTime,[\s\S]*loopEndTime: endTime,[\s\S]*\}\);/.test(appJs),
  'Expected advancePrecomputedPlayback to sample background frames through the focus-lap-aware looping frame resolver'
);

assert(
  /const playbackDuration = Math\.max\(0, lastFrameTime - firstFrameTime\);/.test(appJs),
  'Expected background frame looping to derive a playable duration from the serialized background playback frames'
);

assert(
  /if \(sampleTime <= firstFrameTime \+ 1e-9\) \{[\s\S]*prevIndex = 0;[\s\S]*nextIndex = Math\.min\(frames\.length - 1,\s*1\);[\s\S]*\}/.test(appJs),
  'Expected the background frame resolver to pin playback start to the first frame pair instead of blending against the last frame'
);

console.log('validate_background_playback_loop_after_last_frame: ok');
