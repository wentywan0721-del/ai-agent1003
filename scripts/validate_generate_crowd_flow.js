const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const startIndex = source.indexOf(signature);
  assert(startIndex >= 0, `expected ${name} to exist`);
  const braceStart = source.indexOf('{', startIndex);
  assert(braceStart >= 0, `expected ${name} to have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

const generateBody = extractFunctionBody(appSource, 'handleGenerateCrowd');
const runHeatmapBody = extractFunctionBody(appSource, 'handleRunHeatmap');

assert(
  !generateBody.includes('Sim.precomputeHeatPlayback'),
  'generate crowd should not synchronously precompute heat playback'
);

assert(
  runHeatmapBody.includes('fetchLocalHeatmapPlayback'),
  'run heatmap should first request precomputed playback from the local Node service when needed'
);

assert(
  runHeatmapBody.includes('precomputeHeatmapPlaybackInBrowser'),
  'run heatmap should still keep a browser-side fallback precompute path'
);

console.log('validate_generate_crowd_flow: ok');
