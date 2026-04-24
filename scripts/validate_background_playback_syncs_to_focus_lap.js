const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractNamedFunction(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `expected to find ${functionName} in app.js`);
  let paramsEnd = -1;
  let parenDepth = 0;
  for (let index = start + marker.length - 1; index < source.length; index += 1) {
    const char = source[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  assert(paramsEnd >= 0, `expected to parse parameters for ${functionName}`);
  const braceStart = source.indexOf('{', paramsEnd);
  assert(braceStart >= 0, `expected to find function body for ${functionName}`);
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`failed to parse ${functionName}`);
}

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const functionSource = extractNamedFunction(appSource, 'resolveLoopedBackgroundPlaybackFramePair');
const context = vm.createContext({ Math, Number });
vm.runInContext(`${functionSource}; this.resolveLoopedBackgroundPlaybackFramePair = resolveLoopedBackgroundPlaybackFramePair;`, context);

const backgroundField = {
  frames: [
    { time: 0, agents: [{ id: 'bg-1', active: true, position: { x: 0, y: 0 } }] },
    { time: 60, agents: [{ id: 'bg-1', active: true, position: { x: 6, y: 0 } }] },
    { time: 120, agents: [{ id: 'bg-1', active: true, position: { x: 12, y: 0 } }] },
  ],
};

const held = context.resolveLoopedBackgroundPlaybackFramePair(backgroundField, 130, {
  loopStartTime: 0,
  loopEndTime: 140,
});
assert.strictEqual(
  held.sampleTime,
  120,
  'background playback must not wrap before the focus-agent lap ends'
);

const legacyLoop = context.resolveLoopedBackgroundPlaybackFramePair(backgroundField, 130);
assert.strictEqual(
  legacyLoop.sampleTime,
  10,
  'background playback should still loop independently when no focus-lap end is provided'
);

console.log('validate_background_playback_syncs_to_focus_lap: ok');
