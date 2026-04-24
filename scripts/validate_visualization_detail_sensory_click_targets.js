const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getVisualizationDetailClickableHotspots\(activeView = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\) \{/.test(appJs),
  'Expected a dedicated helper that resolves clickable detail-view issue cards from the current Section 04 panel state'
);

assert(
  /function getDisplayedHotspots\(\) \{[\s\S]*const detailHotspots = getVisualizationDetailClickableHotspots\(activeView\);[\s\S]*return detailHotspots;/.test(appJs),
  'Expected detail-view hotspot resolution to reuse the current Section 04 clickable issue-card set'
);

assert(
  /function getHotspotById\(id = state\.selectedHotspotId\) \{[\s\S]*const detailHotspots = getVisualizationDetailClickableHotspots\(\);[\s\S]*detailHotspots\.find\(\(item\) => item\.id === id \|\| item\.mapTargetId === id \|\| item\.mapTargetIds\?\.includes\(id\)\)/.test(appJs),
  'Expected clicked detail issue cards to resolve hotspot ids from the current Section 04 clickable issue-card set'
);

console.log('validate_visualization_detail_sensory_click_targets: ok');
