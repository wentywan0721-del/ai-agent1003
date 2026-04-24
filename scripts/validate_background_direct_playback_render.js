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
  /backgroundPlaybackRenderState:\s*null/.test(appSource),
  'state should track a lightweight playback render state for direct background frame rendering'
);

assert(
  /function ensureBackgroundCrowdWebglCapacity\(/.test(appSource),
  'webgl renderer should expose a reusable buffer capacity helper'
);

const runtimeFactoryBody = extractFunctionBody(appSource, 'createBackgroundWebglRuntime');
assert(
  /positions:\s*new Float32Array\(0\)/.test(runtimeFactoryBody)
  && /sizes:\s*new Float32Array\(0\)/.test(runtimeFactoryBody)
  && /colors:\s*new Float32Array\(0\)/.test(runtimeFactoryBody)
  && /ringInners:\s*new Float32Array\(0\)/.test(runtimeFactoryBody),
  'webgl runtime should allocate reusable typed arrays instead of per-frame temporary JS arrays'
);

const advanceBody = extractFunctionBody(appSource, 'advancePrecomputedPlayback');
assert(
  /state\.backgroundPlaybackRenderState = backgroundPlaybackState \? \{[\s\S]*prevFrame,[\s\S]*nextFrame,[\s\S]*ratio,[\s\S]*backgroundFrameTimeSpan,[\s\S]*\} : null;/.test(advanceBody),
  'precomputed playback advance should stash the current background frame pair for direct rendering'
);
assert(
  !/state\.scenario\.backgroundAgents = interpolateBackgroundPlaybackAgents/.test(advanceBody),
  'precomputed playback should stop materializing a freshly interpolated background agent array every frame'
);

const webglBody = extractFunctionBody(appSource, 'renderBackgroundCrowdWebgl');
assert(
  /const trajectoryCache = ensureBackgroundPlaybackTrajectoryCache\(getActivePlayback\(\)\?\.backgroundField\);/.test(webglBody)
  && /fillBackgroundCrowdWebglFromTrajectoryCache/.test(webglBody),
  'webgl renderer should read the packed background trajectory cache directly'
);
assert(
  /ensureBackgroundCrowdWebglCapacity\(runtime, projectedCount\);/.test(webglBody),
  'webgl renderer should reuse growable typed buffers'
);
assert(
  /runtime\.positions\[/.test(webglBody)
  && /runtime\.sizes\[/.test(webglBody)
  && /runtime\.colors\[/.test(webglBody)
  && /runtime\.ringInners\[/.test(webglBody),
  'webgl renderer should fill reusable typed arrays in place instead of allocating new frame arrays'
);

assert(
  /gl\.bufferSubData\(/.test(webglBody),
  'webgl renderer should stream into existing GPU buffers with bufferSubData instead of reallocating buffer storage every playback frame'
);

console.log('validate_background_direct_playback_render: ok');
