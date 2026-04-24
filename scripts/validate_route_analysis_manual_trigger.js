const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

const detailViewStart = appJs.indexOf('function renderVisualizationDetailView() {');
const detailViewEnd = appJs.indexOf('function handleVisualizationDetailCotClick(event) {');
const detailViewSource = detailViewStart >= 0 && detailViewEnd > detailViewStart
  ? appJs.slice(detailViewStart, detailViewEnd)
  : '';

assert(
  !/data-call-route-analysis="true"/.test(appJs),
  'Expected Section 04 CoT panel to keep the old manual LLM trigger button removed'
);

assert(
  detailViewSource && !detailViewSource.includes('void ensureRouteAnalysisForCurrentState(state.locale);'),
  'Expected Section 04 detail view to stop auto-requesting route analysis and rely on heatmap playback hydration'
);

assert(
  /function renderReportModal\(\)[\s\S]*ensureRouteAnalysisForCurrentState\(reportLocale\)/.test(appJs),
  'Expected report modal to retain the shared route-analysis fetch path'
);

console.log('validate_route_analysis_manual_trigger: ok');
