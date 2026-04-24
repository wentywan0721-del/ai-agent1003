const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const AGENT_PREVIEW_REFERENCE_OPAQUE_HEIGHT = 63;/.test(appJs),
  'Expected Section 02 preview figure height baseline to shrink by 25%'
);

assert(
  /const AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_X = 48;/.test(appJs),
  'Expected Section 02 preview figure baseline to shift right'
);

assert(
  /const AGENT_PREVIEW_REFERENCE_OPAQUE_CENTER_Y = 50;/.test(appJs),
  'Expected Section 02 preview figure baseline to vertically align every pose by the same opaque-body center'
);

console.log('validate_section02_preview_scale_offset: ok');
