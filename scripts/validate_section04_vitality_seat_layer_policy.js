const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function applyVisualizationDetailSeatLayerPolicy\(nextViewMode, previousViewMode = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\) \{[\s\S]*activeCategories\.add\('seat'\)/.test(appJs),
  'Expected Section04 vitality view to auto-enable the seat layer'
);

assert(
  /function applyVisualizationDetailSeatLayerPolicy\(nextViewMode, previousViewMode = getSafeViewMode\(state\.visualizationDetailView \|\| state\.viewMode\)\) \{[\s\S]*activeCategories\.delete\('seat'\)/.test(appJs),
  'Expected Section04 leaving vitality view to remove the seat layer again'
);

assert(
  /function openVisualizationDetailView\(viewId = COMPOSITE_BURDEN_VIEW\) \{[\s\S]*applyVisualizationDetailSeatLayerPolicy\(safeViewId, previousDetailView\);/.test(appJs),
  'Expected Section04 detail-view switches to apply the seat-layer auto-open policy'
);

console.log('validate_section04_vitality_seat_layer_policy: ok');
