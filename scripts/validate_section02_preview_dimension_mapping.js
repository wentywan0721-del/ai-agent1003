const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /regionTargets:\s*Object\.freeze\(\{[\s\S]*cognitive:[\s\S]*sensory:[\s\S]*psychological:[\s\S]*vitality:[\s\S]*locomotor:/m.test(appJs),
  'Expected Section 02 pose metadata to define explicit semantic body-region targets for all five dimensions'
);

assert(
  /function getAgentPreviewDimensionTarget\(/.test(appJs)
  && /function getAgentPreviewSelectedComponentsForDimension\(/.test(appJs),
  'Expected Section 02 preview to resolve body regions through explicit dimension-target selection helpers'
);

assert(
  /drawAgentPreviewRegionFromSource[\s\S]*getAgentPreviewSelectedComponentsForDimension\(/.test(appJs)
  && /computeAgentPreviewPoseGeometryAnchorsFromCanvas[\s\S]*getAgentPreviewSelectedComponentsForDimension\(/.test(appJs),
  'Expected both filling and connector-anchor calculation to use the same semantic region selection'
);

console.log('validate_section02_preview_dimension_mapping: ok');
