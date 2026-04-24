const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

const visionRingIndex = appJs.indexOf("parts.push(`<circle class=\"vision-ring\"");
const hotspotLoopIndex = appJs.indexOf('selectedHotspotOverlays.forEach(({ item: hotspotItem, hotspotTarget, rank, hotspot: overlayHotspot }) => {');

assert(
  visionRingIndex !== -1 && hotspotLoopIndex !== -1 && visionRingIndex < hotspotLoopIndex,
  'Expected the vision ring to render before pressure hotspot overlays so hotspots stay above it'
);

assert(
  /\.vision-ring\s*\{[\s\S]*pointer-events:\s*none;/.test(css),
  'Expected the vision ring to ignore pointer events so it cannot block hotspot hover detection'
);

console.log('validate_vision_ring_layer_order: ok');
