const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function renderVisualizationCapabilityRadar\(/.test(appJs),
  'Expected Section04 to define a shared radar renderer'
);

assert(
  /readOnlyMarkerMode:\s*'none'/.test(appJs),
  'Expected Section04 read-only radar renderers to disable colored report dots explicitly'
);

assert(
  /const readOnlyMarkerMode = interactive\s*\?\s*'interactive'\s*:\s*\(options\.readOnlyMarkerMode \|\| 'ring'\);/.test(appJs),
  'Expected radar SVG builder to support configurable read-only marker modes'
);

console.log('validate_section04_readonly_radar_no_report_dots: ok');
