const assert = require('assert');
const fs = require('fs');
const path = require('path');

const APP_JS_PATH = path.join(__dirname, '..', 'src', 'app.js');
const source = fs.readFileSync(APP_JS_PATH, 'utf8');

function expectMatch(pattern, message) {
  assert(pattern.test(source), message);
}

function extractFunctionBody(name) {
  const signature = `function ${name}(`;
  const start = source.indexOf(signature);
  assert(start >= 0, `expected ${name} to exist`);
  const braceStart = source.indexOf('{', start);
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
  throw new Error(`failed to parse ${name} body`);
}

expectMatch(/needsPlaybackRender:\s*false/, 'state should track playback-only render requests');
expectMatch(/function renderPlaybackFrame\(\)/, 'app should expose a playback-only render path');

const playbackBody = extractFunctionBody('renderPlaybackFrame');
assert(/renderBackgroundCrowdCanvas\(\)/.test(playbackBody), 'playback-only render should redraw background crowd');
assert(/renderOverlayLayer\(\)/.test(playbackBody), 'playback-only render should redraw moving overlays');
assert(/renderBaseLayer\(\)/.test(playbackBody) === false, 'playback-only render should not rebuild static base layer');
assert(/renderRouteModal\(\)/.test(playbackBody) === false, 'playback-only render should not rebuild route modal');

const animationBody = extractFunctionBody('animationLoop');
assert(/state\.needsPlaybackRender\s*=\s*true/.test(animationBody), 'animation loop should request playback-only renders while animating');
assert(/renderPlaybackFrame\(\)/.test(animationBody), 'animation loop should execute playback-only renders');

console.log('validate_playback_render_split: ok');
