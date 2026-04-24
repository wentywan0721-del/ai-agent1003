const fs = require('fs');
const path = require('path');

const runnerJs = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !/raw: cloneNumericArray\(heat\?\.raw\)/.test(runnerJs)
  && !/pressureAcc: cloneNumericArray\(heat\?\.pressureAcc\)/.test(runnerJs)
  && !/fatigueAcc: cloneNumericArray\(heat\?\.fatigueAcc\)/.test(runnerJs)
  && !/progressAcc: cloneNumericArray\(heat\?\.progressAcc\)/.test(runnerJs),
  'Expected serialized heat payload to omit raw accumulation arrays'
);

assert(
  /const frameStride = 1;/.test(runnerJs),
  'Expected background playback serialization to preserve every motion frame for the main playback renderer'
);

console.log('validate_heatmap_slim_payload: ok');
