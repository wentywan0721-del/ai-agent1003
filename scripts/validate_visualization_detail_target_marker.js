const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const selectedTargetNodeId =[\s\S]*playbackFocusInspection\?\.selectedTargetNodeId[\s\S]*playbackFocusSnapshot\?\.selectedTargetNodeId[\s\S]*state\.scenario\?\.focusAgent\?\.selectedTargetNodeId/.test(appJs),
  'Expected the detail overlay to resolve the live selected target node id instead of relying only on target-region anchors'
);

assert(
  /const selectedTargetNode = selectedTargetNodeId \? state\.prepared\.nodeById\?\.\[selectedTargetNodeId\] \|\| null : null;/.test(appJs),
  'Expected the detail overlay to resolve the selected target node object from the prepared node map'
);

assert(
  /const endPoint = selectedTargetNode \|\| state\.scenario\?\.focusRoute\?\.endAnchor \|\| activeTargetRegion\?\.anchor \|\| null;/.test(appJs),
  'Expected the detail overlay end marker to prefer the actual selected target node before falling back to route or region anchors'
);

assert(
  /const markerNodeIds = new Set\(\[[\s\S]*selectedTargetNodeId[\s\S]*\]\.filter\(Boolean\)\);/.test(appJs),
  'Expected marker-node suppression to use the same selected target node id as the detail end marker'
);

console.log('validate_visualization_detail_target_marker: ok');
