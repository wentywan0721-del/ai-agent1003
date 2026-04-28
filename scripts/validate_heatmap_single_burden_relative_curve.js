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
  /function applySingleBurdenRelativeDisplayCurve\(/.test(appJs),
  'Expected a dedicated continuous display curve for single-burden heatmaps'
);

assert(
  /HEAT_SINGLE_BURDEN_RELATIVE_LOW_QUANTILE/.test(appJs)
  && /HEAT_SINGLE_BURDEN_RELATIVE_HIGH_QUANTILE/.test(appJs),
  'Expected single-burden heatmaps to use route-relative robust display quantiles'
);

assert(
  /const isSingleBurdenView\s*=\s*viewMode !== 'composite' && viewMode !== 'vitality';/.test(legacyBody),
  'Expected relative contrast enhancement to be scoped to single-burden views only'
);

assert(
  /isSingleBurdenView\s*\?\s*HEAT_SINGLE_BURDEN_RELATIVE_LOW_QUANTILE\s*:\s*0\.02/.test(legacyBody)
  && /isSingleBurdenView\s*\?\s*HEAT_SINGLE_BURDEN_RELATIVE_HIGH_QUANTILE\s*:\s*0\.98/.test(legacyBody),
  'Expected composite heatmaps to keep the existing range while single-burden maps use the relative range'
);

assert(
  /isSingleBurdenView\s*\?\s*applySingleBurdenRelativeDisplayCurve\(displayNormalized\)\s*:\s*displayNormalized/.test(legacyBody),
  'Expected only single-burden maps to apply the continuous relative display curve to the original burden color value'
);

assert(
  !/当前路线内相对负担强弱|relative burden strength for this route/i.test(appJs),
  'Expected no additional legend note or explanatory copy for relative heatmap display'
);

console.log('validate_heatmap_single_burden_relative_curve: ok');
