const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function getFunctionBlock(source, signature) {
  const start = source.indexOf(signature);
  assert(start >= 0, `Missing function signature: ${signature}`);
  const braceStart = source.indexOf('{', start);
  assert(braceStart >= 0, `Missing opening brace for: ${signature}`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`Unterminated function block: ${signature}`);
}

function assertOrder(block, items, message) {
  let lastIndex = -1;
  items.forEach((item) => {
    const index = block.indexOf(item, lastIndex + 1);
    assert(index >= 0, `Missing token "${item}" while checking: ${message}`);
    assert(index > lastIndex, message);
    lastIndex = index;
  });
}

const syncBlock = getFunctionBlock(appJs, 'function renderVisualizationPlaybackLayers()');
assert(
  syncBlock.includes('if (!state.visualizationDetailView) {'),
  'Expected playback-stage sync to skip overview mode and only update the live detail stage'
);
assert(
  syncBlock.includes('renderVisualizationStage(activeView, {'),
  'Expected playback-stage sync to redraw the active visualization detail stage'
);
assert(
  syncBlock.includes('background: elements.visualizationDetailBackground'),
  'Expected playback-stage sync to target the detail background canvas'
);

const playbackBlock = getFunctionBlock(appJs, 'function renderPlaybackFrame()');
assertOrder(
  playbackBlock,
  [
    'renderBackgroundCrowdCanvas();',
    'renderVisualizationPlaybackLayers();',
    'if (shouldRenderUiPanels) {',
    'renderVisualizationShell();',
  ],
  'Expected playback frame to refresh the live detail stage before throttled UI shell updates'
);

console.log('validate_visualization_detail_playback_frame_sync: ok');
