const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function paintHeatSurface\(ctx, surface, width, height, style = null, revealMask = null\) \{[\s\S]*ctx\.globalAlpha = 1;[\s\S]*ctx\.drawImage\(surface,\s*0,\s*0,\s*width,\s*height\);/.test(appSource)
  && /paintHeatSurface\(ctx, heatSurface, width, height, heatmapStyle\);/.test(appSource),
  'Expected all heatmap views to share the same direct surface presentation pass'
);

console.log('validate_heatmap_uniform_visual_pass: ok');
