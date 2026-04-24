const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function getRevealedHeatCells\(/.test(appJs),
  'Expected playback heatmap rendering to build the currently revealed heat cells directly'
);

assert(
  /const renderedHeatCells = shouldDrawRasterField && !heatFullyRevealed[\s\S]*getRevealedHeatCells\(/.test(appJs),
  'Expected playback heatmap rendering to update the heat field from revealed cells instead of applying a path mask'
);

assert(
  /const finalHeatCells = getFinalHeatCells\(/.test(appJs),
  'Expected renderHeatmap to render from a precomputed final heat field'
);

console.log('validate_heatmap_reveal_mask_render: ok');
