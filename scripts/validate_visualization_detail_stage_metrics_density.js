const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function renderVisualizationDetailStageMetrics\(target = elements\.visualizationDetailStageMetrics\) \{[\s\S]*\{ id: 'time', icon: 'time', label: t\('label\.travelTime'\), value: summary \? formatDuration\(summary\.travelTime\) : '--' \},[\s\S]*\{ id: 'progress', icon: 'progress', label: t\('label\.progress'\), value: summary \? formatPercent\(\(summary\.progress \|\| 0\) \* 100\) : '--' \}/.test(appJs),
  'Expected Section 04 stage metrics to source travel time and route progress from the same synchronized summary state'
);

assert(
  appJs.includes("function formatCrowdDensityValue(value)")
    && /function renderVisualizationDetailStageMetrics\(target = elements\.visualizationDetailStageMetrics\) \{[\s\S]*\{ id: 'crowd', icon: 'crowd', label: t\('visualization\.congestion'\), value: inspection \? formatCrowdDensityValue\(inspection\.crowdDensity \|\| 0\) : '--' \}/.test(appJs)
    && appJs.includes("congestion: '人群密度'")
    && appJs.includes("congestion: 'Crowd Density'"),
  'Expected Section 04 stage metrics to replace congestion with crowd density'
);

console.log('validate_visualization_detail_stage_metrics_density: ok');
