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
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

const body = extractFunctionBody(appSource, 'getLocalHeatCellMetric');

assert(
  body.includes('const precomputedMetric = Number(getBurdenMetricFromScores(cell?.burdenScores || {}, metricId));'),
  'Expected heat cell metrics to read precomputed burden scores from each heat cell first'
);

assert(
  body.includes('if (Number.isFinite(precomputedMetric)) {')
  && body.includes('return Math.max(0, precomputedMetric);'),
  'Expected precomputed heat cell metrics to bypass live scenario-time inspection when available'
);

console.log('validate_heatmap_precomputed_cell_metrics: ok');
