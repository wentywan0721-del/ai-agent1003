const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /if \(shouldDrawRasterField && heatRaster\) \{[\s\S]*ctx\.filter = 'none';[\s\S]*ctx\.globalAlpha = 0\.42;[\s\S]*ctx\.drawImage\(heatRaster, topLeft\.x, topLeft\.y, drawWidth, drawHeight\);[\s\S]*\}/.test(appJs),
  'Expected non-vitality heatmaps to add a crisp, non-blurred raster pass after the soft blur layers'
);

console.log('validate_heatmap_crisp_core_pass: ok');
