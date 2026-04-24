const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /ctx\.globalAlpha = 1;/.test(appJs),
  'Expected the final heat raster pass to render at full opacity for stronger color visibility'
);

console.log('validate_heatmap_visual_strength: ok');
