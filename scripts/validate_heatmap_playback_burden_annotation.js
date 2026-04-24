const assert = require('assert');
const fs = require('fs');
const path = require('path');

const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

assert(
  coreSource.includes('function annotatePlaybackHeatBurdenScores(prepared, workingScenario) {'),
  'Expected heat playback precompute to annotate route heat cells with burden scores'
);

assert(
  coreSource.includes('cell.burdenScores = extractBurdenScores(dimensionState);'),
  'Expected annotated heat cells to carry fixed burden scores for client rendering'
);

assert(
  coreSource.includes('function buildPrecomputedPlaybackResult(prepared, workingScenario) {')
  && coreSource.includes('annotatePlaybackHeatBurdenScores(prepared, workingScenario);'),
  'Expected playback result building to inject burden-score annotations before serializing heat cells'
);

console.log('validate_heatmap_playback_burden_annotation: ok');
