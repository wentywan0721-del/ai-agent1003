const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /visualizationDetailStageDeferredView:\s*null/.test(appJs)
    && /visualizationDetailStageRenderScheduled:\s*false/.test(appJs),
  'Expected Section04 detail stage deferred render state'
);

assert(
  /function scheduleVisualizationDetailStageRender\(viewMode\)/.test(appJs),
  'Expected a deferred Section04 detail stage renderer'
);

assert(
  /window\.requestAnimationFrame\(\(\) => \{\s*window\.requestAnimationFrame/.test(appJs),
  'Expected detail stage render to wait for layout to settle across animation frames'
);

assert(
  /state\.visualizationDetailStageDeferredView\s*=\s*safeViewId/.test(appJs),
  'Expected opening Section04 detail view to mark stage render as deferred'
);

assert(
  /if \(state\.visualizationDetailStageDeferredView === activeView\)[\s\S]*clearVisualizationStageCanvas\(elements\.visualizationDetailHeat\)[\s\S]*scheduleVisualizationDetailStageRender\(activeView\)/.test(appJs),
  'Expected initial detail render to avoid drawing a misaligned heatmap before the container is stable'
);

console.log('validate_section04_detail_stage_deferred_render: ok');
