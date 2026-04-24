const fs = require('fs');
const path = require('path');

const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /const existingBackgroundField = workingScenario\.backgroundFieldActive && workingScenario\.backgroundField/.test(coreJs),
  'Expected heat playback precompute to detect an already attached background field'
);

assert(
  /const backgroundField = existingBackgroundField \|\| await precomputeBackgroundFieldAsyncWithWorkingScenario\(/.test(coreJs),
  'Expected heat playback precompute to reuse the existing background field instead of recomputing it'
);

console.log('validate_heatmap_background_precompute_dedup: ok');
