const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

assert(
  source.includes('function getHeatCellMetricCacheKey'),
  'app.js should define getHeatCellMetricCacheKey for local heat metric caching'
);

assert(
  source.includes('function getLocalHeatCellMetric'),
  'app.js should define getLocalHeatCellMetric for cell-local burden sampling'
);

assert(
  source.includes("metricId !== 'sensory' && metricId !== 'cognitive' && metricId !== 'locomotor' && metricId !== 'psychological'"),
  'getLocalHeatCellMetric should explicitly support sensory, cognitive, locomotor, and psychological views'
);

const revealedMatch = source.match(/function getRevealedHeatCells[\s\S]*?return heatState\.cells[\s\S]*?\.filter\(Boolean\);\s*}/);
assert(revealedMatch, 'getRevealedHeatCells should exist');
assert(
  revealedMatch[0].includes('getLocalHeatCellMetric('),
  'getRevealedHeatCells should use getLocalHeatCellMetric instead of only trace snapshot burden values'
);

console.log('validate_local_heat_field: ok');
