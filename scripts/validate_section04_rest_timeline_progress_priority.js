const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

const functionSourceMatch = appJs.match(/function getVisualizationDetailTimelineActiveOrder\(timeline = \[\]\) \{[\s\S]*?return fallbackBest\?\.order \|\| null;\s*\}/);
assert(functionSourceMatch, 'Expected getVisualizationDetailTimelineActiveOrder to exist');

const functionSource = functionSourceMatch[0];
const sampleIndex = functionSource.indexOf('const sampleSteps = timeline');
const selectedTargetIndex = functionSource.indexOf('const selectedTargetNodeId = String(');
assert(sampleIndex >= 0, 'Expected timeline active-order logic to inspect sample-based progress steps');
assert(selectedTargetIndex >= 0, 'Expected timeline active-order logic to inspect selected target node ids');
assert(
  sampleIndex < selectedTargetIndex,
  'Expected Section04 timeline active-order logic to prioritize playback progress samples before selectedTargetNodeId fallback so rest-search playback can continue advancing'
);

console.log('validate_section04_rest_timeline_progress_priority: ok');
