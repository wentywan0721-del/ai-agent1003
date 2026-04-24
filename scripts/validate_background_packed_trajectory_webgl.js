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
  /function ensureBackgroundPlaybackTrajectoryCache\(/.test(appSource)
  && /packed-v1/.test(appSource)
  && /samplePackedBackgroundTrajectoryPoint/.test(appSource),
  'background playback should use the restored packed trajectory cache path'
);

assert(
  /function getInterpolatedBackgroundPlaybackAgents\(/.test(appSource),
  'direct frame interpolation fallback should remain available for background playback'
);

const webglBody = extractFunctionBody(appSource, 'renderBackgroundCrowdWebgl');
assert(
  /const trajectoryCache = ensureBackgroundPlaybackTrajectoryCache\(getActivePlayback\(\)\?\.backgroundField\);/.test(webglBody)
  && /fillBackgroundCrowdWebglFromTrajectoryCache/.test(webglBody),
  'webgl renderer should read the packed background trajectory cache directly'
);

assert(
  !/const interpolatedPlaybackAgents = getInterpolatedBackgroundPlaybackAgents\(transform\);/.test(webglBody),
  'webgl renderer should not rebuild interpolated background agent objects every frame'
);

console.log('validate_background_packed_trajectory_webgl: ok');
