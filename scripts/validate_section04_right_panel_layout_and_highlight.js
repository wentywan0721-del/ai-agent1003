const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  /<aside id="visualization-detail-report" class="visualization-detail__report">[\s\S]*<div class="visualization-detail__report-content">[\s\S]*id="visualization-detail-cot"[\s\S]*id="visualization-detail-issues"[\s\S]*id="visualization-detail-export-report-btn"/.test(indexHtml),
  'Expected Section04 right panel to keep one unified scroll flow for CoT, issues, and export button'
);

assert(
  /\.visualization-detail__report-content\s*\{[\s\S]*overflow:\s*auto;[\s\S]*scrollbar-gutter:\s*stable both-edges;/.test(stylesCss)
  && /\.visualization-detail__report-title\s*\{[\s\S]*font-size:\s*14px;[\s\S]*white-space:\s*nowrap;/.test(stylesCss)
  && /\.visualization-detail__report-block--cot\s*\{[\s\S]*padding-bottom:\s*15px;/.test(stylesCss)
  && /\.visualization-detail__report-block--issues\s*\{[\s\S]*margin-top:\s*15px;[\s\S]*padding-top:\s*15px;[\s\S]*padding-bottom:\s*30px;/.test(stylesCss)
  && /\.visualization-detail__export\s*\{[\s\S]*margin-top:\s*auto;/.test(stylesCss),
  'Expected Section04 right panel spacing and scroll behavior to match the final layout spec'
);

assert(
  /function renderOverlayLayer\(target = elements\.overlayLayer, options = \{\}\) \{[\s\S]*const detailHotspotHighlightParts = \[\];[\s\S]*visualization-detail-hotspot-ring/.test(appJs)
  && /function findVisualizationDetailHoverTarget\(clientX, clientY, overlayElement = elements\.visualizationDetailOverlay\) \{[\s\S]*selectedHotspotOverlays/.test(appJs)
  && /\.visualization-detail-hotspot-ring\s*\{[\s\S]*fill:\s*none;[\s\S]*stroke-width:\s*1;/.test(stylesCss),
  'Expected Section04 map highlight to use the final ring-only hotspot style with hover support in detail view'
);

console.log('validate_section04_right_panel_layout_and_highlight: ok');
