const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const cssSource = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  appSource.includes("const showInlineHotspotRank = shouldRenderInlineHotspotRank(activeViewMode, overlayHotspot) && rank && hotspotTarget?.type !== 'pressure';"),
  'pressure hotspots should not render inline rank numbers'
);

assert(
  appSource.includes("const showHotspotRankBadge = activeViewMode !== 'cognitive' && activeViewMode !== 'psychological' && activeViewMode !== 'sensory' && activeViewMode !== 'vitality' && rank && hotspotTarget?.type !== 'pressure';"),
  'pressure hotspots should not render rank badges'
);

assert(
  !appSource.includes('hotspot-highlight-dot'),
  'pressure hotspot rendering should no longer emit inner highlight dots'
);

assert(
  appSource.includes('worldRadiusForPixels(7, transform)'),
  'pressure hotspot ring radius should be 7px'
);

assert(
  appSource.includes('hotspot-highlight-ring hotspot-highlight-ring--pressure'),
  'pressure hotspot should render a dedicated ring-only class'
);

assert(
  cssSource.includes('.hotspot-highlight-ring')
    && cssSource.includes('stroke-width: 1;'),
  'hotspot highlight ring should keep a 1px stroke'
);

assert(
  cssSource.includes('.hotspot-highlight-ring--pressure')
    && cssSource.includes('fill: none;'),
  'pressure hotspot ring should be hollow'
);

console.log('validate_pressure_hotspot_ring: ok');
