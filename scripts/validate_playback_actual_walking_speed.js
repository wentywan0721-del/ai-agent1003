const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('actualWalkingSpeed') || appJs.includes('getPlaybackActualWalkingSpeed'),
  'Section04 playback inspection should expose actual walking speed derived from adjacent playback snapshot displacement'
);

assert(
  !appJs.includes('walkingSpeed: Number.isFinite(realtimeWalkingSpeed) ? realtimeWalkingSpeed : (Number.isFinite(fallbackWalkingSpeed) ? fallbackWalkingSpeed : 0)'),
  'Playback inspection should not display raw currentWalkingSpeed/fallback walkingSpeed when precomputed snapshots are available'
);

console.log('validate_playback_actual_walking_speed: ok');
