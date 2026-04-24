const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function getSelectedHotspotOverlayItems\(\) \{[\s\S]*rankingValue[\s\S]*sort\([\s\S]*rank:\s*index \+ 1/.test(appJs),
  'Expected vitality hotspot overlays to compute an overlayRank by sorting selected pressure targets'
);

assert(
  /const highlightedPressureRadius = worldRadiusForPixels\(4,\s*transform\);/.test(appJs),
  'Expected highlighted vitality hotspot inner circle radius to be 4px'
);

assert(
  /\.hotspot-highlight-ring\s*\{[\s\S]*stroke-width:\s*1;/.test(stylesCss)
    && /\.hotspot-highlight-dot\s*\{[\s\S]*stroke-width:\s*1;/.test(stylesCss)
    && /\.hotspot-inline-rank\s*\{[\s\S]*font-size:\s*2px;/.test(stylesCss),
  'Expected vitality hotspot overlay styles to use the updated ring stroke and inner rank text size'
);

console.log('validate_vitality_hotspot_badge_style: ok');
