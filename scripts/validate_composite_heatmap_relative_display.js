const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('HEAT_COMPOSITE_RELATIVE_LOW_QUANTILE'),
  'Expected composite heatmap to define its own relative low quantile'
);
assert(
  appJs.includes('HEAT_COMPOSITE_RELATIVE_HIGH_QUANTILE'),
  'Expected composite heatmap to define its own relative high quantile'
);
assert(
  /function applyCompositeRelativeDisplayCurve\(normalized\)/.test(appJs),
  'Expected composite heatmap to use a continuous pixel-field display curve'
);
assert(
  !/function buildCompositeRouteSequenceProfile\(cells\)/.test(appJs),
  'Composite heatmap must not use route-sequence smoothing; it should remain a true pixel heat field'
);
assert(
  !/function getCompositeRouteDisplayNormalized\(metric, routeSequenceProfile, fallbackNormalized, traceProgressMeters\)/.test(appJs),
  'Composite heatmap must not normalize display color along the route sequence'
);
assert(
  /const isCompositeRelativeView = viewMode === 'composite';/.test(appJs),
  'Expected composite heatmap raster path to explicitly opt into relative display'
);
assert(
  !/compositeRouteSequenceProfile/.test(appJs),
  'Composite heatmap raster path must not prepare a route sequence profile'
);
assert(
  /isCompositeRelativeView \? HEAT_COMPOSITE_RELATIVE_LOW_QUANTILE/.test(appJs),
  'Expected composite heatmap to use composite relative quantiles instead of absolute defaults'
);
assert(
  /isCompositeRelativeView\s*\?\s*applyCompositeRelativeDisplayCurve\(displayNormalized\)/.test(appJs),
  'Expected composite palette sampling to use pixel-wise display normalization'
);
assert(
  /const shouldDrawLegendPeakLayer = isSingleBurdenView;/.test(appJs),
  'Expected composite heatmap not to reuse the single-burden peak overlay layer'
);

console.log('validate_composite_heatmap_relative_display: ok');
