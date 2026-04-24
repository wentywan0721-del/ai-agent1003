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
  appSource.includes('function createHeatFieldRaster(revealedHeatCells, localPressureMin, localPressureMax, style = getHeatmapViewStyle(), transform = state.transform) {'),
  'Expected heat raster creation to accept the current transform so non-vitality heatmaps render in screen space'
);

const body = extractFunctionBody(appSource, 'createHeatFieldRaster');

assert(
  body.includes('const point = worldToScreen(cell, transform);'),
  'Expected non-vitality heat raster generation to place kernels in screen space instead of grid pixel space'
);

console.log('validate_heatmap_screen_space_raster: ok');
