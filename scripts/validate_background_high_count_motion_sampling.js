const assert = require('assert');
const fs = require('fs');
const path = require('path');

const runnerSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const coreSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'core.js'), 'utf8');

function extractFunctionBody(source, name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  let paramsEnd = -1;
  let parenDepth = 0;
  for (let index = start + signature.length - 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '(') parenDepth += 1;
    if (char === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  assert(paramsEnd >= 0, `expected ${name} to have balanced parameters`);
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

assert(
  /const frameStride = 1;/.test(runnerSource),
  'background playback serialization should stop thinning main-workspace background motion frames'
);

assert(
  /precomputeBackgroundFieldAsyncWithWorkingScenario\(prepared,\s*workingScenario,\s*\{[\s\S]*?frameStepSeconds:\s*0\.08/.test(coreSource),
  'precomputed playback should request focus-like 0.08s background snapshots so background motion uses nearly the same playback cadence as the focus agent'
);

assert(
  /const frameStepSeconds = Math\.max\(0\.08,\s*safeNumber\(options\?\.frameStepSeconds,\s*0\.08\)\);/.test(coreSource),
  'background field generation defaults should preserve the focus-like 0.08s playback cadence instead of falling back to a coarser background-only cadence'
);

const advanceBody = extractFunctionBody(appSource, 'advancePrecomputedPlayback');
assert(
  /const backgroundFrameTimeSpan = prevFrame && nextFrame[\s\S]*?Math\.max\(0,\s*Number\(nextFrame\.time\)\s*-\s*Number\(prevFrame\.time\)\)/.test(advanceBody),
  'playback advance should keep the sampled background frame gap so render interpolation can reason about motion continuity'
);
assert(
  /backgroundFrameTimeSpan/.test(advanceBody),
  'playback advance should store the sampled background frame gap in lightweight render state'
);

const interpolationBody = extractFunctionBody(appSource, 'getInterpolatedBackgroundPlaybackAgents');
assert(
  /backgroundFrameTimeSpan/.test(interpolationBody)
  && /maxInterpolatedDistance/.test(interpolationBody),
  'direct background frame interpolation should still use sampled frame gap when deciding whether a background point can be interpolated smoothly'
);

console.log('validate_background_high_count_motion_sampling: ok');
