const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function getFunctionBlock(source, signature) {
  const start = source.indexOf(signature);
  assert(start >= 0, `Missing function signature: ${signature}`);
  const braceStart = source.indexOf('{', start);
  assert(braceStart >= 0, `Missing opening brace for: ${signature}`);
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
  throw new Error(`Unterminated function block: ${signature}`);
}

const functionSource = getFunctionBlock(appJs, 'function getPlaybackSnapshotAtTime(time = Number(state.scenario?.playbackRevealTime || 0), playback = getActivePlayback())');
assert(
  !functionSource.includes('const anchor = ratio < 0.5 ? previous : current;'),
  'Discrete playback state should not jump to the next snapshot at the midpoint of the segment'
);

const context = {
  Number,
  Math,
  state: {
    scenario: {
      playbackRevealTime: 5,
    },
    playbackSnapshotCache: null,
    focusProfile: {
      capacityScores: {},
    },
  },
  getActivePlayback() {
    return null;
  },
  getPlaybackFocusSnapshotBucket(time) {
    return time;
  },
  getPlaybackActualWalkingSpeed() {
    return 0;
  },
  findPlaybackTraceUpperBound() {
    return 0;
  },
  clamp(value, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return min;
    }
    return Math.min(max, Math.max(min, numeric));
  },
  interpolateValue(left, right, key, ratio, fallback = 0) {
    const leftValue = Number(left?.[key]);
    const rightValue = Number(right?.[key]);
    const from = Number.isFinite(leftValue) ? leftValue : fallback;
    const to = Number.isFinite(rightValue) ? rightValue : from;
    return from + (to - from) * ratio;
  },
  interpolateDimensionScoreMap() {
    return {};
  },
  cloneCapacityScoreMap(value) {
    return value ? { ...value } : {};
  },
  cloneDimensionScoreMap(value) {
    return value ? { ...value } : {};
  },
  clonePlaybackArray(value) {
    return Array.isArray(value) ? value.map((item) => ({ ...item })) : [];
  },
  getFatigueThreshold() {
    return 100;
  },
  getTopBurdenIdFromScores() {
    return 'cognitive';
  },
  t() {
    return '';
  },
};

vm.createContext(context);
vm.runInContext(`${functionSource}; this.getPlaybackSnapshotAtTime = getPlaybackSnapshotAtTime;`, context);

const playback = {
  traceSnapshots: [
    {
      time: 0,
      progress: 0,
      restState: 'none',
      decisionDiagnostics: { decisionNodeId: 'a' },
      topPressureSources: [{ id: 'p1' }],
      nearbySeats: [],
    },
    {
      time: 10,
      progress: 1,
      restState: 'searching',
      decisionDiagnostics: { decisionNodeId: 'b' },
      topPressureSources: [{ id: 'p2' }],
      nearbySeats: [{ id: 'seat_1' }],
    },
  ],
};

const snapshot = context.getPlaybackSnapshotAtTime(5, playback);
assert.strictEqual(
  snapshot.restState,
  'none',
  'At the midpoint between two playback snapshots, discrete state should still reflect the previous step until the next snapshot time is actually reached'
);
assert.strictEqual(
  snapshot.decisionDiagnostics.decisionNodeId,
  'a',
  'Decision diagnostics should stay on the previous discrete state until the next snapshot boundary'
);

console.log('validate_playback_snapshot_discrete_state_alignment: ok');
