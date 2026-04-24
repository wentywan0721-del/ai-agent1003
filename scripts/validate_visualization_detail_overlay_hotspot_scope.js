const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /selectedHotspotOverlays\.forEach\(\(\{\s*item:\s*hotspotItem,\s*hotspotTarget,\s*rank,\s*hotspot:\s*overlayHotspot\s*\}\)\s*=>/.test(appJs),
  'Expected detail overlay hotspot rendering to destructure the current overlay hotspot explicitly'
);

assert(
  /const showInlineHotspotRank = shouldRenderInlineHotspotRank\(activeViewMode,\s*overlayHotspot\) && rank;/.test(appJs),
  'Expected inline hotspot rank rendering to use the scoped overlay hotspot instead of an undefined variable'
);

assert(
  /function openVisualizationDetailView\(viewId = COMPOSITE_BURDEN_VIEW\) \{[\s\S]*state\.selectedHotspotId = null;[\s\S]*state\.selectedHotspotOverlaySnapshot = null;/.test(appJs),
  'Expected opening a single-view detail panel to clear stale hotspot selection state'
);

console.log('validate_visualization_detail_overlay_hotspot_scope: ok');
