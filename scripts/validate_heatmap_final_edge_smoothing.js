const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !/options\.fullReveal\s*\?\s*1\s*:/.test(appJs),
  'Expected final heat cells to keep trace-distance revealWeight instead of forcing fully opaque edges'
);

assert(
  /function getHeatCellAlpha\(pressure,\s*revealWeight = 1\)/.test(appJs),
  'Expected heat cell alpha to accept revealWeight for edge feathering'
);

assert(
  /const alpha = Math\.pow\(getHeatCellAlpha\(pressure,\s*cell\.revealWeight\),\s*alphaGamma\);/.test(appJs),
  'Expected heat raster alpha to incorporate each cell revealWeight'
);

assert(
  /function paintHeatSurface\(ctx, surface, width, height, style = null, revealMask = null\) \{[\s\S]*ctx\.globalAlpha = 1;[\s\S]*ctx\.drawImage\(surface,\s*0,\s*0,\s*width,\s*height\);/.test(appJs)
  && /paintHeatSurface\(ctx, heatSurface, width, height, heatmapStyle\);/.test(appJs),
  'Expected final heatmap rendering to present the prepared heat surface directly at full opacity'
);

console.log('validate_heatmap_final_edge_smoothing: ok');
