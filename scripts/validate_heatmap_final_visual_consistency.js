const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const activeTraceSnapshots = heatFullyRevealed \? fullTraceSnapshots : revealTraceSnapshots;/.test(appJs),
  'Expected final and playback heatmaps to select trace snapshots only by reveal progress'
);

assert(
  /const renderedHeatCells = shouldDrawRasterField && !heatFullyRevealed[\s\S]*\?\s*getRevealedHeatCells\(heatState,\s*revealTraceSnapshots,\s*activeViewMode,\s*traceRevealRadiusMeters\)[\s\S]*:\s*finalHeatCells;/.test(appJs),
  'Expected final and playback heatmaps to use the same heat-field rendering chain with only the revealed cell set changing'
);

assert(
  !/const revealMask = shouldDrawRasterField/.test(appJs),
  'Expected final heatmap mode not to switch between masked and unmasked rendering branches'
);

console.log('validate_heatmap_final_visual_consistency: ok');
