const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /traceProgressMeters/.test(appJs),
  'Expected trace-scoped heat cells to retain their nearest progress along the route'
);

assert(
  /function annotateSingleBurdenCellProminence\(/.test(appJs),
  'Expected single-burden heatmaps to annotate per-cell local prominence before KDE rendering'
);

assert(
  /HEAT_SINGLE_BURDEN_LOCAL_BASELINE_RADIUS_METERS/.test(appJs)
  && /HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR/.test(appJs),
  'Expected local prominence enhancement to use explicit spatial baseline and alpha constants'
);

assert(
  /prominenceBuffer\s*=\s*new Float32Array/.test(appJs),
  'Expected heatmap prominence to be accumulated through the KDE raster buffer'
);

const legacyStart = appJs.indexOf('function createHeatFieldRasterLegacy');
const legacyEnd = appJs.indexOf('function createHeatFieldRaster(', legacyStart);
assert(legacyStart >= 0 && legacyEnd > legacyStart, 'Expected createHeatFieldRasterLegacy to exist');
const legacyBody = appJs.slice(legacyStart, legacyEnd);

assert(
  /const rasterHeatCells = isSingleBurdenView\s*\?\s*annotateSingleBurdenCellProminence\(revealedHeatCells\)\s*:\s*revealedHeatCells;/.test(legacyBody),
  'Expected only single-burden raster fields to annotate local prominence'
);

assert(
  /const localProminence = isSingleBurdenView\s*\?\s*clamp\(prominenceBuffer\[index\] \/ Math\.max\(metricWeight,\s*1e-6\),\s*0,\s*1\)\s*:\s*1;/.test(legacyBody),
  'Expected single-burden visual prominence to be driven by KDE-diffused local cell increments'
);

assert(
  !/当前路线内相对负担强弱|relative burden strength for this route/i.test(appJs),
  'Expected no additional legend note or explanatory copy'
);

console.log('validate_heatmap_route_sequence_enhancement: ok');
