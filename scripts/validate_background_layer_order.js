const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const backgroundIndex = html.indexOf('id="background-crowd-canvas"');
const heatmapIndex = html.indexOf('id="heatmap-layer"');

assert(backgroundIndex >= 0, 'expected background crowd canvas in index.html');
assert(heatmapIndex >= 0, 'expected heatmap layer in index.html');
assert(
  backgroundIndex > heatmapIndex,
  'expected background crowd canvas to appear after the heatmap canvas so background people render above the heatmap'
);

console.log('validate_background_layer_order: ok');
