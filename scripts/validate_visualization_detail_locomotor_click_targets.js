const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /getVisualizationDetailClickableHotspots[\s\S]*resolveHotspotTargets\(item\)\.length/.test(appJs),
  'Expected Section 04 clickable issue cards to allow non-pressure targets such as locomotor nodes or queue-zone anchors'
);

assert(
  /const hotspotLinkId = isDetailIssueClickable\(item, activeView\) \? \(item\.id \|\| item\.mapTargetId \|\| ''\) : ''/.test(appJs),
  'Expected detail issue cards to stay clickable for locomotor node and queue-zone targets'
);

assert(
  /function isDetailIssueClickable[\s\S]*activeView === 'locomotor'[\s\S]*itemId === 'locomotor-queue'/.test(appJs),
  'Expected locomotor detail view to allow only the queue issue card to be clickable'
);

assert(
  /handleVisualizationDetailIssueClick[\s\S]*const hotspotTargets = resolveHotspotTargets\(hotspot\)[\s\S]*if \(!hotspotTargets\.length\)/.test(appJs),
  'Expected detail issue click handling to accept any resolved hotspot targets instead of pressure-only targets'
);

assert(
  /overlayHotspot\?\.overlayKind === 'queue-zone'/.test(appJs),
  'Expected detail overlay rendering to recognize queue-zone locomotor highlights'
);

assert(
  /const selectedNodeOverlay = selectedHotspotOverlays\.find[\s\S]*if \(markerNodeIds\.has\(node\.id\) && !selectedNodeOverlay\)/.test(appJs),
  'Expected selected locomotor node overlays to remain visible even when the node is also a route marker'
);

assert(
  /visualization-detail__issue-impact-label/.test(appJs),
  'Expected detail issue cards to render an impact label row instead of the old category-meta line'
);

console.log('validate_visualization_detail_locomotor_click_targets: ok');
