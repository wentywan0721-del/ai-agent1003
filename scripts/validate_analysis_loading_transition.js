const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  /id="analysis-loading-screen"/.test(html),
  'Expected a dedicated analysis loading screen between settings and workspace'
);

assert(
  /analysisLoadingScreen:\s*document\.getElementById\('analysis-loading-screen'\)/.test(appJs),
  'Expected app.js to bind the analysis loading screen element'
);

assert(
  /showUiScreen\('analysis-loading'\)/.test(appJs),
  'Expected Start Analysis to transition into analysis-loading instead of jumping directly to workspace'
);

assert(
  /await handleRunHeatmap\(\)/.test(appJs),
  'Expected settings start analysis flow to await the existing heatmap computation before entering workspace'
);

assert(
  /showUiScreen\('workspace'\)/.test(appJs),
  'Expected the workspace transition to still happen after loading completes'
);

assert(
  /settingsStartAnalysisBtn\.textContent\s*=\s*state\.heatmapComputing[\s\S]*formatPercent\(state\.heatmapComputeProgress \* 100\)/.test(appJs),
  'Expected the Start Analysis button to reflect live compute progress text'
);

console.log('validate_analysis_loading_transition: ok');
