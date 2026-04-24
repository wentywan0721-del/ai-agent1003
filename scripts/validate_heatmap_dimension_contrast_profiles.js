const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  !/function applyHeatDisplayContrast\(/.test(appJs),
  'Expected the temporary per-view heat contrast curve helper to be removed after reverting the contrast tweak'
);

assert(
  !/displayRangeLowQuantile:/.test(appJs)
  && !/displayRangeHighQuantile:/.test(appJs)
  && !/displayGamma:/.test(appJs)
  && !/displayContrastBoost:/.test(appJs),
  'Expected the temporary per-view contrast tuning fields to be removed from the heatmap styles'
);

assert(
  /const baseRgb = samplePaletteRgb\(normalized,\s*colorStops\);\s*return baseRgb;/.test(appJs),
  'Expected display colors to return to direct palette sampling after reverting the contrast tweak'
);

console.log('validate_heatmap_dimension_contrast_profiles: ok');
