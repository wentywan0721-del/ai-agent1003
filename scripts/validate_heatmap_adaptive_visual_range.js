const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getHeatDisplayRangeFromValues\(/.test(appJs),
  'Expected heatmap rendering to compute an adaptive display range from local route values'
);

assert(
  /quantileSorted\(sortedValues,\s*0\.08\)/.test(appJs)
  && /quantileSorted\(sortedValues,\s*0\.92\)/.test(appJs),
  'Expected heatmap display range to use the default robust quantiles after reverting the temporary per-view tuning'
);

assert(
  /const localMetricRange = getHeatDisplayRangeFromValues\(localMetricValues\);/.test(appJs)
  && /localMetricRange\.min/.test(appJs)
  && /localMetricRange\.max/.test(appJs),
  'Expected renderHeatmap to pass the adaptive display range into raster rendering'
);

console.log('validate_heatmap_adaptive_visual_range: ok');
