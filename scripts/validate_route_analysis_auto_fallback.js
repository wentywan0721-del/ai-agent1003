const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const detailViewStart = appJs.indexOf('function renderVisualizationDetailView() {');
const detailViewEnd = appJs.indexOf('function bindVisualizationDetailCotTrigger() {');
const detailViewSource = detailViewStart >= 0 && detailViewEnd > detailViewStart
  ? appJs.slice(detailViewStart, detailViewEnd)
  : '';

assert(
  detailViewSource && !detailViewSource.includes('void ensureRouteAnalysisForCurrentState(state.locale);'),
  'Expected Section 04 detail panel to stop auto-requesting the legacy route-analysis endpoint'
);

assert(
  !/data-call-route-analysis="true"/.test(appJs),
  'Expected the old manual route-analysis trigger button to remain removed'
);

console.log('validate_route_analysis_auto_fallback: ok');
