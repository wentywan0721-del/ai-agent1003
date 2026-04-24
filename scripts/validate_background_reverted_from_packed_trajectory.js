const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /packed-v1|ensureBackgroundPlaybackTrajectoryCache|fillBackgroundCrowdWebglFromTrajectoryCache|samplePackedBackgroundTrajectoryPoint/.test(appSource),
  'background playback should restore the packed trajectory cache path'
);

assert(
  /frame\.agents\s*=\s*null/.test(appSource),
  'background playback should release frame.agents after building packed trajectory cache'
);

assert(
  /function getInterpolatedBackgroundPlaybackAgents\(/.test(appSource),
  'background playback should keep the direct frame interpolation path'
);

console.log('validate_background_reverted_from_packed_trajectory: ok');
