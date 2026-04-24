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
  /function interpolateBackgroundPlaybackPosition\(/.test(appSource),
  'background playback should expose a dedicated position interpolation helper instead of only doing a raw two-point lerp'
);

const framePairBody = extractFunctionBody(appSource, 'resolveLoopedBackgroundPlaybackFramePair');
assert(
  /prevPrevFrame/.test(framePairBody) && /nextNextFrame/.test(framePairBody),
  'looped background frame resolver should expose neighboring frames so background playback can curve through motion like the focus agent'
);

const webglBody = extractFunctionBody(appSource, 'renderBackgroundCrowdWebgl');
assert(
  /interpolateBackgroundPlaybackPosition\(/.test(webglBody),
  'webgl background renderer should use the dedicated playback position interpolator instead of only doing a linear previous-current lerp'
);

console.log('validate_background_playback_curve_interpolation: ok');
