const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const legacyStart = appJs.indexOf('function createHeatFieldRasterLegacy');
const legacyEnd = appJs.indexOf('function createHeatFieldRaster(', legacyStart);
assert(legacyStart >= 0 && legacyEnd > legacyStart, 'Expected createHeatFieldRasterLegacy to exist');

const legacyBody = appJs.slice(legacyStart, legacyEnd);

assert(
  /coverageBuffer\s*=\s*new Float32Array/.test(legacyBody),
  'Expected non-vitality raster visibility to use a pressure-independent coverage buffer'
);

assert(
  !/const weight\s*=\s*kernel\s*\*\s*\([^)]*alpha/.test(legacyBody),
  'Expected KDE visibility weight not to be reduced by pressure-derived alpha'
);

assert(
  /image\.data\[offset \+ 3\]\s*=\s*Math\.round\(clamp\(edgeAlpha \* prominenceAlpha,\s*0,\s*1\)\s*\*\s*255\)/.test(legacyBody),
  'Expected visible heatmap pixels to preserve palette color while local prominence modulates visibility'
);

assert(
  /rasterCtx\.globalCompositeOperation\s*=\s*'source-over'/.test(legacyBody),
  'Expected peak layer to be alpha-composited instead of replacing base pixels'
);

assert(
  /metricPowerBuffer\s*=\s*new Float32Array/.test(legacyBody)
  && /HEAT_SINGLE_BURDEN_SOFT_PEAK_POWER/.test(legacyBody),
  'Expected single-burden heatmaps to keep local high-burden peaks with a continuous soft-peak metric'
);

assert(
  /viewMode !== 'composite' && viewMode !== 'vitality'/.test(legacyBody)
  && /softPeakMetric/.test(legacyBody),
  'Expected soft-peak enhancement to apply only to non-composite, non-fatigue burden maps'
);

console.log('validate_heatmap_non_vitality_visible_range: ok');
