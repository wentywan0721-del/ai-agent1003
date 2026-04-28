const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function renderVisualizationDetailPlaybackFramePanels\(\)/.test(appJs),
  'Expected Section04 playback to have a lightweight panel renderer'
);

assert(
  /state\.visualizationDetailView\s*\?\s*renderVisualizationDetailPlaybackFramePanels\(\)\s*:\s*renderVisualizationShell\(\)/.test(appJs),
  'Expected playback frame UI updates to avoid rebuilding the full Section04 shell'
);

assert(
  /renderVisualizationDetailStageMetrics\(elements\.visualizationDetailStageMetrics\)/.test(appJs)
    && /renderVisualizationStatusMonitor\(elements\.visualizationDetailStatus\)/.test(appJs),
  'Expected lightweight renderer to keep dynamic metrics and status values live'
);

assert(
  /buildVisualizationDetailCotMarkup\(\)/.test(appJs)
    && /buildVisualizationDetailIssuesMarkup\(\)/.test(appJs),
  'Expected lightweight renderer to keep decision-chain highlight and issue panel live'
);

console.log('validate_section04_playback_lightweight_panel_render: ok');
