const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  !/fillSeeds:\s*Object\.freeze\(/.test(appJs),
  'Expected the new preview pipeline to remove the legacy flood-fill seed metadata'
);

assert(
  !/function floodFillAgentPreviewRegion\(/.test(appJs),
  'Expected app.js to remove the legacy flood-fill region painter'
);

assert(
  /metadata\.regionMasks\?\.\[dimensionId\]/.test(appJs)
  && /metadata\.sourceSearchBox/.test(appJs),
  'Expected pose rendering to use per-dimension compositing masks together with sprite search bounds'
);

console.log('validate_agent_visual_preview_seed_fill: ok');
