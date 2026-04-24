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

const cardsBlock = getFunctionBlock(appJs, 'function renderVisualizationHeatmapCards()');

assert(
  cardsBlock.includes('renderVisualizationStage(viewMode, card);'),
  'Expected Section 03 overview cards to reuse the same stage renderer as Section 04'
);

assert(
  !cardsBlock.includes('blitVisualizationCanvas('),
  'Expected Section 03 overview cards to stop blitting the main workspace canvases'
);

console.log('validate_visualization_overview_matches_detail_render_path: ok');
