const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const showInlineHotspotRank = state\.viewMode === 'psychological' && rank;/.test(appJs)
  && /const showHotspotRankBadge = state\.viewMode !== 'cognitive' && state\.viewMode !== 'psychological' && rank;/.test(appJs) === false
  && /const showHotspotRankBadge = state\.viewMode !== 'cognitive' && state\.viewMode !== 'psychological' && state\.viewMode !== 'sensory' && rank;/.test(appJs),
  'Expected sensory heatmap hotspot overlays to disable the callout line and numbered badge'
);

assert(
  /parts\.push\(`<line class="map-marker-line"/.test(appJs)
  && /if \(showHotspotRankBadge\) \{[\s\S]*<g class="hotspot-highlight-badge">/.test(appJs),
  'Expected numbered badge rendering to remain gated behind the dedicated callout flag'
);

console.log('validate_sensory_hotspot_marker_style: ok');
