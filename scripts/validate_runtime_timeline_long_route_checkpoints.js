const assert = require('assert');

const Runner = require('../server/heatmap-runner.js');

function buildLongPlayback() {
  const traceSnapshots = [];
  for (let index = 0; index <= 120; index += 1) {
    const progress = index / 120;
    traceSnapshots.push({
      time: index,
      progress,
      x: progress * 100,
      y: 10,
      currentWalkingSpeed: 0.72,
      restState: 'none',
      burdenScores: {
        cognitive: 38 + progress * 20,
        locomotor: 35 + progress * 12,
        sensory: 30,
        psychological: 34,
        vitality: 42 + progress * 30,
      },
    });
  }
  return {
    traceSnapshots,
    summary: { duration: 120 },
  };
}

function main() {
  const playback = buildLongPlayback();
  const runtimeEvents = Runner.__private.buildRuntimeEventsFromPlayback(playback);
  const plan = Runner.__private.buildRuntimeFallbackDecisionPlanAnalysis(null, runtimeEvents, playback, 'test');
  assert(
    plan.timeline.length >= 6,
    `expected long route timeline to include progress checkpoints, got ${plan.timeline.length}`
  );
  assert(
    plan.timeline.some((item) => item.runtimeEventType === 'route_progress'),
    'expected long route timeline to include route_progress checkpoints'
  );
  const progressValues = plan.timeline.map((item) => Number(item.progress));
  for (let index = 1; index < progressValues.length; index += 1) {
    assert(progressValues[index] >= progressValues[index - 1], 'expected timeline progress to be monotonic');
  }
}

main();
console.log('validate_runtime_timeline_long_route_checkpoints: ok');
