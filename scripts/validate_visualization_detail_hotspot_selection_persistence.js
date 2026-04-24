const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('selectedHotspotOverlaySnapshot'),
  'Expected app state to keep a snapshot of the selected hotspot overlay for detail-view persistence'
);

assert(
  /function buildSelectedHotspotOverlayEntries\(hotspot\) \{[\s\S]*resolveHotspotTargets\(hotspot\)[\s\S]*filter\(\(target\) => target\.type === 'pressure'\)/.test(appJs),
  'Expected a dedicated helper to build pressure-point overlay entries from a clicked issue item'
);

assert(
  /function getSelectedHotspotOverlayItems\(\) \{[\s\S]*const snapshot = state\.selectedHotspotOverlaySnapshot;[\s\S]*if \(!hotspot\) \{[\s\S]*snapshot\?\.selectionId === state\.selectedHotspotId[\s\S]*return snapshot\.items;/.test(appJs),
  'Expected detail-view hotspot overlays to fall back to the stored snapshot when the live Top3 issue list changes'
);

assert(
  /handleVisualizationDetailIssueClick\(event\) \{[\s\S]*state\.selectedHotspotOverlaySnapshot = \{[\s\S]*selectionId:\s*hotspot\.id[\s\S]*items:\s*buildSelectedHotspotOverlayEntries\(hotspot\)/.test(appJs),
  'Expected detail issue clicks to capture the current pressure-point overlay snapshot'
);

console.log('validate_visualization_detail_hotspot_selection_persistence: ok');
