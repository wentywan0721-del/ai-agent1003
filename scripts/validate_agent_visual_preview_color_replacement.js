const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function composeAgentPreviewPoseImage\(/.test(appJs),
  'Expected app.js to compose the preview from cropped transparent pose sources'
);

assert(
  /function drawAgentPreviewRegionFromSource\([\s\S]*destinationContext\.clip\(\);[\s\S]*destinationContext\.drawImage\(sourceCanvas,\s*0,\s*0\);/.test(appJs),
  'Expected each body region to be replaced by clipping and drawing exact source pixels rather than synthetic tint blending'
);

assert(
  /drawAgentPreviewNeutralBase\(composedContext,\s*neutralSourceCanvas\);/.test(appJs),
  'Expected pose rendering to start from the neutral grayscale base before applying colored region overlays'
);

console.log('validate_agent_visual_preview_color_replacement: ok');
