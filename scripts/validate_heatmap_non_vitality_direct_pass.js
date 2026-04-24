const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function paintHeatSurface\(ctx, surface, width, height, style = null, revealMask = null\) \{[\s\S]*ctx\.globalAlpha = 1;[\s\S]*ctx\.drawImage\(surface,\s*0,\s*0,\s*width,\s*height\);[\s\S]*ctx\.filter = 'none';[\s\S]*\}/.test(appJs)
  && /paintHeatSurface\(ctx, heatSurface, width, height, heatmapStyle\);/.test(appJs),
  'Expected heatmap views to render their prepared surface directly through the shared presentation helper'
);

console.log('validate_heatmap_non_vitality_direct_pass: ok');
