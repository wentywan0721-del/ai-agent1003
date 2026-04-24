const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  const paramsEnd = source.indexOf(')', start);
  const braceStart = source.indexOf('{', paramsEnd);
  assert(braceStart >= 0, `expected ${name} to have a body`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(braceStart + 1, index);
      }
    }
  }
  throw new Error(`failed to parse ${name}`);
}

const animationBody = extractFunctionBody(appSource, 'animationLoop');

assert(
  /const elapsedSeconds = state\.lastFrameTime \? Math\.max\(0, \(timestamp - state\.lastFrameTime\) \/ 1000\) : 0\.016;/.test(animationBody),
  'animation loop should derive elapsed playback time from the real wall-clock frame gap'
);

assert(
  /const playbackDeltaSeconds = Math\.min\(0\.25, elapsedSeconds\);/.test(animationBody),
  'precomputed playback should use a larger wall-clock delta cap so rendered slowdown does not slow route time'
);

assert(
  /const simulationDeltaSeconds = Math\.min\(0\.08, elapsedSeconds\);/.test(animationBody),
  'live simulation path should keep its conservative small-step cap'
);

assert(
  /advancePrecomputedPlayback\(playbackDeltaSeconds\);/.test(animationBody),
  'precomputed playback should advance using the wall-clock playback delta'
);

assert(
  /Sim\.stepScenario\(state\.prepared, state\.scenario, simulationDeltaSeconds\);/.test(animationBody),
  'live simulation should continue to use the conservative simulation delta'
);

console.log('validate_playback_wallclock_rate: ok');
