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
  /function shouldRenderPlaybackOverlayFrame\(/.test(appSource),
  'playback loop should expose an overlay throttle helper instead of rebuilding the whole SVG overlay every frame'
);

const playbackBody = extractFunctionBody(appSource, 'renderPlaybackFrame');
assert(
  /const shouldRenderOverlay = shouldRenderPlaybackOverlayFrame\(\);/.test(playbackBody),
  'playback renderer should compute whether the expensive overlay needs refresh on this frame'
);
assert(
  /if \(shouldRenderOverlay\) \{\s*renderOverlayLayer\(\);\s*\}/.test(playbackBody),
  'playback renderer should stop calling renderOverlayLayer unconditionally every frame'
);

console.log('validate_playback_overlay_throttle: ok');
