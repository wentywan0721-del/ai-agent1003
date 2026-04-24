const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function extractNamedFunction(source, functionName) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  assert(start >= 0, `expected to find ${functionName} in app.js`);
  let braceStart = source.indexOf('{', start);
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

function main() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const functionSource = extractNamedFunction(appSource, 'advancePrecomputedPlayback');
  const calls = {
    lock: 0,
    reset: 0,
    step: 0,
    sync: 0,
  };
  const state = {
    prepared: {},
    scenario: {
      playbackRevealTime: 9.8,
    },
    animationPaused: false,
  };
  const playback = {
    startTime: 0,
    endTime: 10,
  };
  const context = vm.createContext({
    Math,
    Number,
    state,
    getActivePlayback: () => playback,
    lockHeatmapRevealAt: () => {
      calls.lock += 1;
    },
    syncScenarioToPlaybackArtifacts: () => {
      calls.sync += 1;
    },
    Sim: {
      stepScenario: () => {
        calls.step += 1;
      },
      resetScenarioToReplayBaseline: () => {
        calls.reset += 1;
      },
    },
  });
  vm.runInContext(`${functionSource}; this.advancePrecomputedPlayback = advancePrecomputedPlayback;`, context);
  context.advancePrecomputedPlayback(1);

  assert.strictEqual(calls.reset, 1, 'precomputed playback should reset the loop baseline when a lap wraps without background field frames');
  assert.strictEqual(calls.lock, 0, 'playback should no longer auto-lock the reveal at the route end');
  assert(state.scenario.firstPassComplete === false, 'wrapped playback should restart a fresh lap instead of staying in first-pass-complete state');
  assert(state.scenario.loopPlaybackActive === false, 'wrapped playback should replay the lap from the start instead of staying in loop-hold mode');
  assert(Math.abs(state.scenario.playbackRevealTime - 0.8) < 1e-9, `expected playback clock to wrap back into the lap window, got ${state.scenario.playbackRevealTime}`);
  assert.strictEqual(state.animationPaused, false, 'playback loop should not freeze the global animation loop');
}

main();
console.log('validate_heatmap_playback_end_hold: ok');
