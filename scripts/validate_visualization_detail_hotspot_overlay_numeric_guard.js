const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /function buildSelectedHotspotOverlayEntries\(hotspot\)/.test(appJs),
  'Expected detail hotspot overlay helper to exist'
);

assert(
  !/buildSelectedHotspotOverlayEntries\(hotspot\)[\s\S]*?\.sort\(\(left, right\) => \{[\s\S]*safeNumber\(/.test(appJs),
  'Detail hotspot overlay sorting should not call undefined safeNumber, otherwise clicking fatigue issue cards breaks the animation loop and the pressure highlight never appears'
);

console.log('validate_visualization_detail_hotspot_overlay_numeric_guard: ok');
