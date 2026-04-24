const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

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
  /function ensureBackgroundPlaybackTrajectoryCache\(/.test(appSource),
  'background playback should build a reusable per-agent trajectory cache before rendering'
);

assert(
  /function sampleBackgroundPlaybackTrajectory\(/.test(appSource),
  'background playback should expose a dedicated trajectory sampler instead of matching frame arrays on every render tick'
);

const renderBody = extractFunctionBody(appSource, 'renderBackgroundCrowdWebgl');
assert(
  /getSampledBackgroundPlaybackPositions\(/.test(renderBody),
  'webgl background renderer should consume the shared sampled trajectory helper instead of rebuilding background frame matches inside the render loop'
);
assert(
  /sampleBackgroundPlaybackTrajectory\(/.test(appSource),
  'background playback should still expose a dedicated cached trajectory sampler underneath the shared sampling helper'
);

assert(
  /frame\.agents = null;/.test(appSource) || /agents:\s*null/.test(appSource),
  'once background trajectories are cached, the heavy per-frame agent object arrays should be released to avoid whole-playback GC pressure'
);

console.log('validate_background_trajectory_cache: ok');
