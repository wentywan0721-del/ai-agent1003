const assert = require('assert');

const { __private } = require('../server/heatmap-runner.js');

function main() {
  const playback = {
    traceSnapshots: [
      {
        time: 0,
        progress: 0,
        x: 0,
        y: 0,
        currentWalkingSpeed: 0.8,
        restState: 'none',
        decisionDiagnostics: {},
      },
      {
        time: 90,
        progress: 0.9,
        x: 9,
        y: 0,
        currentWalkingSpeed: 0.8,
        restState: 'none',
        decisionDiagnostics: {
          decisionNodeId: 'near_final_sign',
          problemSignCount: 1,
          guideReviewPauseTime: 1,
        },
      },
      {
        time: 100,
        progress: 1,
        x: 10,
        y: 0,
        currentWalkingSpeed: 0,
        restState: 'none',
        playbackComplete: true,
        decisionDiagnostics: {
          decisionNodeId: 'near_final_sign',
          problemSignCount: 1,
          guideReviewPauseTime: 1,
        },
      },
    ],
  };

  const events = __private.buildRuntimeEventsFromPlayback(playback);
  const terminalGuidance = events.find((event) => event.type === 'guidance_pause' && event.progress >= 0.985);

  assert.strictEqual(
    terminalGuidance,
    undefined,
    'terminal completion frames should not generate a guidance_pause that shares timing with route_completed'
  );
  assert.strictEqual(events[events.length - 1]?.type, 'route_completed', 'expected the final runtime event to be route_completed');
}

main();
console.log('validate_runtime_events_skip_terminal_guidance_pause: ok');
