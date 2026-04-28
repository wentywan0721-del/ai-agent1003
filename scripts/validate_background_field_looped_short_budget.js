const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const runnerSource = fs.readFileSync(path.join(rootDir, 'server', 'heatmap-runner.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(rootDir, 'src', 'core.js'), 'utf8');

assert(
  /const BACKGROUND_FIELD_MAX_SIMULATION_SECONDS = 180;/.test(runnerSource),
  'background field generation should use a short reusable cycle instead of simulating an entire long trip'
);

assert(
  /function normalizeBackgroundFieldLoopTime/.test(coreSource),
  'core should normalize background field sampling time into the reusable background cycle'
);

assert(
  /normalizeBackgroundFieldLoopTime\(backgroundField,\s*safeNumber\(targetTime,\s*0\)\)/.test(coreSource),
  'density lookup should sample the reusable background cycle instead of clamping after the cycle ends'
);

assert(
  /normalizeBackgroundFieldLoopTime\(backgroundField,\s*targetTime\)/.test(coreSource),
  'queue lookup should sample the reusable background cycle instead of clamping after the cycle ends'
);

assert(
  /getBackgroundFieldFrameIndex\(scenario\.backgroundField,\s*normalizeBackgroundFieldLoopTime\(scenario\.backgroundField/.test(coreSource),
  'background playback sync should loop the reusable background cycle during focus simulation'
);

console.log('validate_background_field_looped_short_budget: ok');
