const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  appJs.includes('visualizationDetailHoveredPressureId')
    && appJs.includes('function getVisualizationDetailHoveredPressureId(event)')
    && appJs.includes('function getPressurePointHoverValueLabel(item)'),
  'Expected Section 04 vitality hotspot overlay to track hovered pressure points and format hover values'
);

assert(
  /const showInlineHotspotRank = \((?:state\.viewMode|activeViewMode) === 'psychological' \|\| (?:state\.viewMode|activeViewMode) === 'vitality'\) && rank;/.test(appJs)
    && /const showHotspotRankBadge = (?:state\.viewMode|activeViewMode) !== 'cognitive' && (?:state\.viewMode|activeViewMode) !== 'psychological' && (?:state\.viewMode|activeViewMode) !== 'sensory' && (?:state\.viewMode|activeViewMode) !== 'vitality' && rank;/.test(appJs),
  'Expected vitality hotspot overlays to use inline numbered circles without external rank badges'
);

assert(
  appJs.includes('visualization-pressure-hover-label')
    && stylesCss.includes('.visualization-pressure-hover-label'),
  'Expected vitality pressure points to render a hover label beside the numbered circle'
);

console.log('validate_vitality_pressure_hover_overlay: ok');
