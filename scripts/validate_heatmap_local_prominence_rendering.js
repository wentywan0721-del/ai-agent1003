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
  /HEAT_SINGLE_BURDEN_LOCAL_BASELINE_BINS/.test(appJs)
  && /HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR/.test(appJs),
  'Expected local-prominence constants for single-burden heatmap rendering'
);

assert(
  /function annotateSingleBurdenCellProminence\(/.test(appJs),
  'Expected single-burden heatmaps to compute local prominence per heat cell before KDE rendering'
);

assert(
  /prominenceBuffer\s*=\s*new Float32Array/.test(legacyBody)
  && /prominenceBuffer\[index\]\s*\+=\s*metricWeight \* Number\(cell\.localProminence/.test(legacyBody),
  'Expected local prominence to be diffused through the same KDE kernel as the heat field'
);

assert(
  /const paletteNormalized = isSingleBurdenView\s*\?\s*applySingleBurdenRelativeDisplayCurve\(displayNormalized\)\s*:\s*displayNormalized;/.test(legacyBody),
  'Expected original burden value, not local increment, to control the palette color'
);

assert(
  /const localProminence = isSingleBurdenView\s*\?\s*clamp\(prominenceBuffer\[index\] \/ Math\.max\(metricWeight,\s*1e-6\),\s*0,\s*1\)\s*:\s*1;/.test(legacyBody),
  'Expected local increment to control only single-burden visual prominence after KDE diffusion'
);

assert(
  /const prominenceAlpha = isSingleBurdenView\s*\?\s*\(HEAT_SINGLE_BURDEN_PROMINENCE_ALPHA_FLOOR/.test(legacyBody),
  'Expected local prominence to modulate visual alpha without changing the burden score'
);

assert(
  /smoothstep\(0\.58,\s*0\.94,\s*localProminence\)/.test(legacyBody),
  'Expected peak overlay to be driven by local prominence instead of raw high-value color alone'
);

assert(
  !/当前路线内相对负担强弱|relative burden strength for this route/i.test(appJs),
  'Expected no additional legend note or explanatory copy'
);

console.log('validate_heatmap_local_prominence_rendering: ok');
