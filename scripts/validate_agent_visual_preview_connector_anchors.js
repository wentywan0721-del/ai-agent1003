const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /connectorAnchors:\s*Object\.freeze\(\{/.test(appJs),
  'Expected pose metadata to define explicit connector anchors inside the colored body regions'
);

assert(
  /const anchor = metadata\?\.connectorAnchors\?\.\[dimensionId\] \|\| region;/.test(appJs),
  'Expected connector rendering to prefer the explicit in-region anchor points'
);

console.log('validate_agent_visual_preview_connector_anchors: ok');
