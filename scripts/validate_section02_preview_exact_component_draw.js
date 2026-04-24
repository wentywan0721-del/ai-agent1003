const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /if \(selectedComponents\.length\) \{[\s\S]*sourceCanvas = exactRegionCanvas;[\s\S]*destinationContext\.drawImage\(sourceCanvas, 0, 0\);[\s\S]*return;[\s\S]*\}/m.test(appJs),
  'Expected exact fixed-component slices to draw directly without being clipped back down by legacy overlap boxes'
);

console.log('validate_section02_preview_exact_component_draw: ok');
