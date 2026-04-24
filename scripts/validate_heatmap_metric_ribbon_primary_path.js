const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const startIndex = source.indexOf(signature);
  assert(startIndex >= 0, `expected ${name} to exist`);
  const braceStart = source.indexOf('{', startIndex);
  assert(braceStart >= 0, `expected ${name} to have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

assert(
  appSource.includes('const METRIC_RIBBON_WIDTH_METERS = 6;'),
  'Expected the experimental fixed-width metric ribbon constant to remain in the source for fallback use'
);

assert(
  /function createMetricRibbonRaster\(/.test(appSource)
  && /function getCachedMetricRibbonRaster\(/.test(appSource),
  'Expected a dedicated cached ribbon surface pipeline for non-vitality burden views'
);

assert(
  /const shouldDrawRasterField = activeViewMode !== 'vitality';/.test(appSource),
  'Expected non-vitality views to return to the raster-field primary path'
);

assert(
  !/const shouldDrawMetricRibbon =/.test(appSource),
  'Expected the metric ribbon experiment to be removed from the active renderHeatmap branching'
);

assert(
  /function getCachedMetricRibbonRaster\(/.test(appSource)
  && !/renderHeatmap[\s\S]*getCachedMetricRibbonRaster\(/.test(appSource),
  'Expected the metric ribbon cache pipeline to remain available in source but not be used by the primary render path'
);

console.log('validate_heatmap_metric_ribbon_primary_path: ok');
