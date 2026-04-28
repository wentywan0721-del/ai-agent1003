const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /if \(isDetailStage\) \{[\s\S]*renderBaseLayer\(stageElements\.base, stageElements\.overlay, detailTransform, \{ syncState: false \}\);[\s\S]*renderBackgroundCrowdCanvas\(stageElements\.background, detailTransform\);[\s\S]*renderHeatmap\(stageElements\.heat, detailTransform, \{ useSharedCache: false \}\);[\s\S]*renderOverlayLayer\(stageElements\.overlay, \{/.test(appJs),
  'Expected Section04 detail stage to render crowd and heatmap directly into its own canvases with the detail transform'
);

assert(
  /const detailFocusInspectionActive = isVisualizationDetail \|\| state\.selectedDynamic\?\.kind === 'focus-agent';[\s\S]*const effectiveInspection = detailFocusInspectionActive \? \(inspection \|\| dynamicInspection\) : dynamicInspection;/.test(appJs),
  'Expected Section04 detail overlay to follow the live focus inspection even when no workspace selection is active'
);

console.log('validate_section04_detail_stage_direct_render: ok');
