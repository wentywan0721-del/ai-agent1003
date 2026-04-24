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

const stageBlock = getFunctionBlock(appJs, 'function renderVisualizationStage(viewMode, stageElements)');
assertOrder(
  stageBlock,
  [
    'renderHeatmap({',
    'state.heatmapDisplayMode = previousHeatmapDisplayMode;',
    'state.heatmapRevealLocked = previousHeatmapRevealLocked;',
    'state.heatmapRevealFrozenTime = previousHeatmapRevealFrozenTime;',
    'renderBackgroundCrowdCanvas({',
    'renderOverlayLayer({',
  ],
  'Expected Section 04 single-view stage to restore live playback state before drawing background agents and overlay'
);

const cardsBlock = getFunctionBlock(appJs, 'function renderVisualizationHeatmapCards()');
assert(
  cardsBlock.includes('renderVisualizationStage(viewMode, card);'),
  'Expected Section 03 overview cards to reuse the shared direct stage renderer so live motion ordering matches Section 04'
);

assert(
  cardsBlock.includes('restoreVisualizationWorkspaceLayers();'),
  'Expected Section 03 overview cards to restore the main workspace layers after direct card rendering'
);

console.log('validate_visualization_stage_live_motion: ok');
