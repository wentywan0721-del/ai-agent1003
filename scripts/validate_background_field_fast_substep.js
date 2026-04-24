const fs = require('fs');
const path = require('path');

const coreJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  /const maxSubstepSeconds = Math.max\(0\.06, safeNumber\(options\?\.maxSubstepSeconds, 0\.18\)\);/.test(coreJs),
  'Expected stepScenario to accept an overridable maxSubstepSeconds option'
);

assert(
  /maxSubstepSeconds: frameStepSeconds/.test(coreJs),
  'Expected background field precompute to run stepScenario with the coarse frame step as its max substep'
);

console.log('validate_background_field_fast_substep: ok');
