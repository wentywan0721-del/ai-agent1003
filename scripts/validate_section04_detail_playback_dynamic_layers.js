const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function renderVisualizationDetailPlaybackFrameStage\(\s*shouldRenderOverlay\s*=\s*true\s*\)/.test(appJs),
  'Expected Section04 detail playback to have a dynamic-stage renderer'
);

const detailStageMatch = appJs.match(/function renderVisualizationDetailPlaybackFrameStage\(\s*shouldRenderOverlay\s*=\s*true\s*\)\s*\{([\s\S]*?)\n  \}/);
assert(detailStageMatch, 'Expected to locate Section04 detail playback stage renderer body');
const detailStageBody = detailStageMatch[1];

assert(
  /renderBackgroundCrowdCanvas\(\s*\{[\s\S]*targetCanvas:\s*elements\.visualizationDetailBackground[\s\S]*transform:\s*stageTransform[\s\S]*\}\s*\)/.test(detailStageBody),
  'Expected Section04 detail playback to redraw the visible background crowd layer'
);

assert(
  /renderOverlayLayer\(\s*\{[\s\S]*target:\s*elements\.visualizationDetailOverlay[\s\S]*isVisualizationDetail:\s*true[\s\S]*showAllNodes:\s*true[\s\S]*\}\s*\)/.test(detailStageBody),
  'Expected Section04 detail playback to redraw the visible overlay/agent layer'
);

assert(
  !/renderHeatmap\(/.test(detailStageBody),
  'Expected Section04 detail playback stage updates to skip heatmap raster work'
);

const playbackMatch = appJs.match(/function renderPlaybackFrame\(\)\s*\{([\s\S]*?)\n  \}/);
assert(playbackMatch, 'Expected to locate renderPlaybackFrame body');
const playbackBody = playbackMatch[1];
const detailBranchIndex = playbackBody.indexOf('if (state.visualizationDetailView)');
const mainBackgroundIndex = playbackBody.indexOf('renderBackgroundCrowdCanvas();');
const heatmapIndex = playbackBody.indexOf('renderHeatmap();');

assert(detailBranchIndex >= 0, 'Expected renderPlaybackFrame to branch for Section04 detail view');
assert(
  mainBackgroundIndex < 0 || detailBranchIndex < mainBackgroundIndex,
  'Expected Section04 detail playback branch before main background rendering'
);
assert(
  heatmapIndex < 0 || detailBranchIndex < heatmapIndex,
  'Expected Section04 detail playback branch before playback heatmap rendering'
);
assert(
  /renderVisualizationDetailPlaybackFrameStage\(shouldRenderOverlay\)/.test(playbackBody),
  'Expected detail playback branch to update visible dynamic layers'
);

console.log('validate_section04_detail_playback_dynamic_layers: ok');
