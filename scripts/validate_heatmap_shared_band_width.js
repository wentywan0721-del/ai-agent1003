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

const createHeatFieldRasterBody = extractFunctionBody(appSource, 'createHeatFieldRaster');
const getTraceRevealRadiusMetersBody = extractFunctionBody(appSource, 'getTraceRevealRadiusMeters');

assert(
  !createHeatFieldRasterBody.includes('getVitalityRibbonWidth(1, transform)'),
  'Expected non-vitality heat field width not to be tied to the vitality ribbon width'
);

assert(
  createHeatFieldRasterBody.includes('const fieldRadius = Math.max('),
  'Expected non-vitality heat field to derive a continuous kernel radius from the local field scale'
);

assert(
  !createHeatFieldRasterBody.includes('const bandRadius'),
  'Expected non-vitality heat field to stop using a fixed path-band radius'
);

assert(
  getTraceRevealRadiusMetersBody.includes('return Math.max(HEAT_TRACE_RADIUS_METERS, VITALITY_RIBBON_MAX_WIDTH_METERS * 0.5);'),
  'Expected route reveal radius to stay capped at the same 6m corridor width'
);

console.log('validate_heatmap_shared_band_width: ok');
