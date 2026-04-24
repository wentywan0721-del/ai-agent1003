const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function computeAgentPreviewOpaqueBounds\(/.test(appJs),
  'Expected app.js to compute the visible bounds of the transparent source pose images'
);

assert(
  /function drawAgentPreviewRegionFromSource\(/.test(appJs),
  'Expected app.js to define a helper that draws exact body regions from score-matched source images'
);

assert(
  /function composeAgentPreviewPoseImage\(/.test(appJs),
  'Expected app.js to build the Section 02 figure by compositing cropped transparent source images'
);

assert(
  /regionMasks:\s*Object\.freeze\(\{/.test(appJs),
  'Expected pose metadata to define exact compositing masks for the five body regions'
);

assert(
  !/function floodFillAgentPreviewRegion\(/.test(appJs)
  && !/function transformAgentPreviewLineArt\(/.test(appJs),
  'Expected the legacy flood-fill recolor pipeline to be removed from app.js'
);

console.log('validate_agent_visual_preview_compositing: ok');
