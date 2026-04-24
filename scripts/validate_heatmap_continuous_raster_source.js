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

assert(
  createHeatFieldRasterBody.includes('createImageData(')
  && createHeatFieldRasterBody.includes('putImageData('),
  'Expected non-vitality heat raster generation to write a continuous high-resolution field buffer directly'
);

assert(
  !createHeatFieldRasterBody.includes('createRadialGradient('),
  'Expected createHeatFieldRaster to stop using radial gradient blur layers'
);

assert(
  !createHeatFieldRasterBody.includes('for (let rowOffset = 0; rowOffset < HEAT_RASTER_SUPERSAMPLE; rowOffset += 1)'),
  'Expected createHeatFieldRaster not to stamp each heat cell as a hard supersampled square'
);

console.log('validate_heatmap_continuous_raster_source: ok');
