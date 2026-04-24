const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const lineAnchorPoint = getAgentRadarTextPoint\(/.test(appJs),
  'Expected radar axis lines to use a dedicated radial anchor point instead of the label stack anchor'
);

assert(
  /lineEndPoint:\s*\{\s*x:\s*lineAnchorPoint\.x,\s*y:\s*lineAnchorPoint\.y,\s*\}/.test(appJs),
  'Expected radar axis line endpoints to stay on the radial anchor coordinates'
);

assert(
  !/lineEndY\s*:/.test(appJs),
  'Expected radar axis lines to stop using a vertical-only offset that skews diagonal axes'
);

console.log('validate_radar_axis_anchor: ok');
