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
  'Expected display heat colors to use the palette directly'
);

assert(
  !/applyHeatDisplayContrast/.test(appJs),
  'Expected display heat colors not to run through the reverted per-view contrast curve'
);

console.log('validate_heatmap_color_strength: ok');
