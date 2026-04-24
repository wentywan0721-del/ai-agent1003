const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /return baseRgb;/.test(appJs),
  'Expected heatmap colors to keep using the direct palette values'
);

assert(
  /ctx\.globalAlpha = 1;/.test(appJs),
  'Expected the crisp heat raster overlay alpha to render at full opacity after internal smoothing'
);

console.log('validate_heatmap_smooth_strong_balance: ok');
