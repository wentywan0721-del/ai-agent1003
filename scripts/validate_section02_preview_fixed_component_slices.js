const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /regionComponents:\s*Object\.freeze\(\{[\s\S]*cognitive:[\s\S]*sensory:[\s\S]*psychological:[\s\S]*vitality:[\s\S]*locomotor:/m.test(appJs),
  'Expected Section 02 pose metadata to define fixed component groups for all five body regions'
);

assert(
  /function getAgentPreviewRegionComponents\(/.test(appJs),
  'Expected Section 02 preview to resolve body regions from fixed component groups'
);

assert(
  /function getAgentPreviewSelectedComponentsForDimension\([\s\S]*getAgentPreviewRegionComponents\(/.test(appJs)
  && /drawAgentPreviewRegionFromSource[\s\S]*getAgentPreviewSelectedComponentsForDimension\(/.test(appJs)
  && /computeAgentPreviewPoseGeometryAnchorsFromCanvas[\s\S]*getAgentPreviewSelectedComponentsForDimension\(/.test(appJs),
  'Expected fixed component groups to feed the shared body-region selection path'
);

console.log('validate_section02_preview_fixed_component_slices: ok');
