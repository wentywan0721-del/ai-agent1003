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
  /const shouldDrawRasterField = activeViewMode !== 'vitality';/.test(appSource),
  'Expected non-vitality heatmaps to use raster-field rendering on the primary path'
);

assert(
  /const heatRaster = shouldDrawRasterField[\s\S]*getCachedHeatRaster\(/.test(appSource),
  'Expected renderHeatmap to keep cached heat rasters available for the composite view'
);

assert(
  !/renderHeatmap[\s\S]*getCachedMetricRibbonRaster\(/.test(appSource),
  'Expected renderHeatmap not to use the metric ribbon fallback on the primary path'
);

assert(
  appSource.includes('const METRIC_RIBBON_WIDTH_METERS = 6;'),
  'Expected the fixed-width metric ribbon fallback code to stay in source'
);

console.log('validate_heatmap_non_vitality_raster: ok');
