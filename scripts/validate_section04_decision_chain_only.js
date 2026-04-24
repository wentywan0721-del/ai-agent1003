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
  'Expected Section 04 to stop auto-requesting the legacy route-analysis endpoint'
);

assert(
  /const analysisKind = String\(analysis\?\.analysisKind \|\| ''\);/.test(appJs)
  && /analysisKind === 'decision-plan'[\s\S]*sections: localizedSections/.test(appJs),
  'Expected decision-plan outputs to avoid falling back to the legacy risk/reason/advice sections'
);

console.log('validate_section04_decision_chain_only: ok');
