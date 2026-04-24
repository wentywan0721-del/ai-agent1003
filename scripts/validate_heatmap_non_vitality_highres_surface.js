const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getHeatSurfaceRasterScale\(\) \{[\s\S]*return Math\.max\(2, Number\(window\.devicePixelRatio \|\| 1\)\);[\s\S]*\}/.test(appSource),
  'Expected heat surfaces to render at least at 2x resolution for crisp non-vitality heatmaps'
);

assert(
  /function createHeatFieldRaster\(revealedHeatCells, localPressureMin, localPressureMax, style = getHeatmapViewStyle\(\), transform = state\.transform\) \{[\s\S]*const image = rasterCtx\.createImageData\(pixelWidth, pixelHeight\);[\s\S]*rasterCtx\.putImageData\(image, 0, 0\);/.test(appSource),
  'Expected non-vitality heat field rendering to write a high-resolution image buffer directly'
);

console.log('validate_heatmap_non_vitality_highres_surface: ok');
