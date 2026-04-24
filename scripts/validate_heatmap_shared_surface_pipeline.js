const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getHeatSurfaceRasterScale\(\) \{[\s\S]*Math\.max\(2, Number\(window\.devicePixelRatio \|\| 1\)\)[\s\S]*\}/.test(appSource),
  'Expected a shared heat surface raster scale helper based on devicePixelRatio'
);

assert(
  /function createHeatFieldRaster\(revealedHeatCells, localPressureMin, localPressureMax, style = getHeatmapViewStyle\(\), transform = state\.transform\) \{[\s\S]*const rasterScale = getHeatSurfaceRasterScale\(\);[\s\S]*raster\.width = Math\.max\(1, Math\.round\(width \* rasterScale\)\);[\s\S]*const image = rasterCtx\.createImageData\(pixelWidth, pixelHeight\);[\s\S]*rasterCtx\.putImageData\(image, 0, 0\);/.test(appSource),
  'Expected non-vitality heat raster generation to render into a high-resolution offscreen surface'
);

assert(
  /function createVitalityRibbonRaster\(traceSnapshots, transform, localMetricMin, localMetricMax, rasterScale = getHeatSurfaceRasterScale\(\)\) \{/.test(appSource),
  'Expected vitality ribbon rendering to be routed through an offscreen surface'
);

assert(
  /function paintHeatSurface\(ctx, surface, width, height, style = null, revealMask = null\) \{[\s\S]*ctx\.drawImage\(surface, 0, 0, width, height\);/.test(appSource),
  'Expected a shared helper to present heat surfaces on the main heatmap canvas'
);

assert(
  /paintHeatSurface\(ctx, heatSurface, width, height, heatmapStyle\);/.test(appSource),
  'Expected renderHeatmap to use the shared surface presentation helper for both vitality and non-vitality views'
);

console.log('validate_heatmap_shared_surface_pipeline: ok');
