const assert = require('assert');
const fs = require('fs');
const path = require('path');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /locomotorCopy:\s*'Physical movement resistance caused by walking distance, vertical transfer, and queue\.'/.test(appJs),
  'Expected the Section 03 mobility explanation to remove the long "effects" wording'
);

assert(
  /\.visualization-stage-base\s+\.walkable-shape\s*\{[\s\S]*stroke:\s*none;/.test(stylesCss)
  && /\.visualization-stage-base\s+\.obstacle-shape\s*\{[\s\S]*fill:\s*var\(--route-stage-obstacle-fill\);[\s\S]*stroke:\s*none;/.test(stylesCss),
  'Expected Section 03/04 base plans to remove outlines and reuse the Section 01 obstacle fill'
);

assert(
  /\.visualization-node-dot\s*\{[\s\S]*fill:\s*rgba\(108,\s*116,\s*126,\s*0\.96\);/.test(stylesCss)
  && /\.visualization-node-hover-label\s*\{[\s\S]*opacity:\s*0;/.test(stylesCss)
  && /\.visualization-node-hover-label\.is-visible\s*\{[\s\S]*opacity:\s*1;/.test(stylesCss),
  'Expected Section 04 to define hoverable node dots and labels'
);

assert(
  /\.visualization-anchor-badge\s+circle\s*\{[\s\S]*fill:\s*rgba\(108,\s*116,\s*126,\s*0\.96\);/.test(stylesCss)
  && /\.visualization-anchor-badge\s+text\s*\{[\s\S]*fill:\s*rgba\(255,\s*255,\s*255,\s*0\.96\);[\s\S]*font-size:\s*5px;/.test(stylesCss)
  && /markerType === 'start' \? 'S' : 'E'/.test(appJs),
  'Expected Section 04 to render S/E as lighter dark badges with larger white labels inside the dots'
);

assert(
  /\.visualization-node-hover-label\s*\{[\s\S]*font-size:\s*2px;/.test(stylesCss),
  'Expected Section 04 node hover labels to use the requested 2px text size'
);

assert(
  /\.agent-dot\.focus-ring\s*\{[\s\S]*stroke:\s*#000000;/.test(stylesCss)
  && /focus-ring/.test(appJs)
  && /stroke-width="\$\{focusRingStrokeWidth\.toFixed\(3\)\}"/.test(appJs),
  'Expected the focus agent to render with a thinner outer ring in the same color'
);

assert(
  /const isDetailOverlay = target === elements\.visualizationDetailOverlay;/.test(appJs)
  && /visualization-node-anchor/.test(appJs)
  && /visualization-anchor-badge/.test(appJs)
  && /visualizationDetailHoveredNodeId/.test(appJs)
  && /handleVisualizationDetailOverlayPointerMove/.test(appJs)
  && /getVisualizationDetailHoveredNodeId/.test(appJs)
  && /visualizationDetailTransform/.test(appJs)
  && /screenToWorld\(event\.clientX,\s*event\.clientY,\s*detailTransform,\s*elements\.visualizationDetailOverlay\)/.test(appJs),
  'Expected detail overlay rendering to branch into dedicated node and S/E markers with explicit hover tracking and a dedicated detail-stage transform'
);

assert(
  /markerNodeIds/.test(appJs)
  && /if \(markerNodeIds\.has\(node\.id\)(?:\s*&&\s*!selectedNodeOverlay)?\) \{\s*return;\s*\}/.test(appJs),
  'Expected detail overlay to skip drawing regular node dots on top of the start/end badges'
);

console.log('validate_visualization_route_stage: ok');
