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

const body = extractFunctionBody(appSource, 'createHeatFieldRaster');

assert(
  body.includes('const image = rasterCtx.createImageData(pixelWidth, pixelHeight);'),
  'Expected non-vitality heat fields to use a direct image buffer for a crisp high-resolution field'
);

assert(
  !body.includes('createRadialGradient(')
  && !body.includes('sharedBandWidth'),
  'Expected non-vitality heat fields to stop using gradient-based or fixed-width path band rendering'
);

console.log('validate_heatmap_non_vitality_crisp_band: ok');
