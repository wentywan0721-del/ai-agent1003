const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /regionMasks:\s*Object\.freeze\(\{/.test(appJs),
  'Expected pose metadata to define fixed body-part compositing masks instead of only broad single ellipses'
);

assert(
  /function drawAgentPreviewRegionFromSource\(/.test(appJs)
  && /function getAgentPreviewComponentMaskOverlap\([\s\S]*const maskShapes = Array\.isArray\(regionMask\?\.shapes\)/.test(appJs),
  'Expected region compositing to support multiple local mask shapes per body part, including exact source-pixel extraction'
);

assert(
  /cognitive:\s*Object\.freeze\(\{\s*shapes:\s*Object\.freeze\(\[/.test(appJs)
  && /sensory:\s*Object\.freeze\(\{\s*shapes:\s*Object\.freeze\(\[/.test(appJs)
  && /psychological:\s*Object\.freeze\(\{\s*shapes:\s*Object\.freeze\(\[/.test(appJs)
  && /vitality:\s*Object\.freeze\(\{\s*shapes:\s*Object\.freeze\(\[/.test(appJs)
  && /locomotor:\s*Object\.freeze\(\{\s*shapes:\s*Object\.freeze\(\[/.test(appJs),
  'Expected all five dimensions to use explicit local mask-shape groups'
);

console.log('validate_agent_visual_preview_mask_shapes: ok');
