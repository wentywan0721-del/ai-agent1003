const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const renderableBackgroundCount = getRenderableBackgroundAgents\(state\.scenario\?\.backgroundAgents \|\| \[\]\)\.length;/.test(appJs),
  'Expected dynamic summary to derive occupancy from the currently rendered background playback agents'
);

assert(
  /progress: Number\(inspection\?\.progress \|\| 0\)/.test(appJs),
  'Expected dynamic summary to carry route progress from the current focus inspection'
);

assert(
  /renderVisualizationDetailStageMetrics\(target = elements\.visualizationDetailStageMetrics\) \{[\s\S]*\{ id: 'time', icon: 'time', label: t\('label\.travelTime'\), value: summary \? formatDuration\(summary\.travelTime\) : '--' \},[\s\S]*\{ id: 'progress', icon: 'progress', label: t\('label\.progress'\), value: summary \? formatPercent\(\(summary\.progress \|\| 0\) \* 100\) : '--' \}/.test(appJs),
  'Expected Section 04 stage metrics to render travel time and route progress from the same summary state'
);

assert(
  /renderVisualizationEnvironmentPanel\(target = elements\.visualizationEnvironmentPanel\) \{[\s\S]*\{ id: 'progress', icon: 'progress', label: t\('label\.progress'\), value: summary \? formatPercent\(\(summary\.progress \|\| 0\) \* 100\) : '--' \}/.test(appJs),
  'Expected Section 03 environment metrics to render route progress from the synchronized summary state'
);

console.log('validate_visualization_runtime_metric_sync: ok');
