const assert = require('assert');

const Runner = require('../server/heatmap-runner.js');

function main() {
  const playback = {
    traceSnapshots: [
      {
        time: 0,
        progress: 0,
        x: 0,
        y: 0,
        currentWalkingSpeed: 0.7,
        restState: 'none',
        burdenScores: { cognitive: 20, locomotor: 20, sensory: 20, psychological: 20, vitality: 20 },
      },
      {
        time: 20,
        progress: 0.2,
        x: 20,
        y: 0,
        currentWalkingSpeed: 0.7,
        restState: 'none',
        burdenScores: { cognitive: 75, locomotor: 20, sensory: 20, psychological: 20, vitality: 20 },
        topBurdenId: 'cognitive',
        topPressureSources: [{ name: 'Advertisement', category: 'advertisement', score: 1 }],
      },
      {
        time: 80,
        progress: 0.8,
        x: 80,
        y: 0,
        currentWalkingSpeed: 0.7,
        restState: 'none',
        burdenScores: { cognitive: 62, locomotor: 20, sensory: 20, psychological: 20, vitality: 20 },
      },
      {
        time: 100,
        progress: 1,
        x: 100,
        y: 0,
        currentWalkingSpeed: 0.7,
        restState: 'none',
        burdenScores: { cognitive: 62, locomotor: 20, sensory: 20, psychological: 20, vitality: 20 },
      },
    ],
    summary: { duration: 100 },
  };
  const events = Runner.__private.buildRuntimeEventsFromPlayback(playback);
  const plan = Runner.__private.buildRuntimeFallbackDecisionPlanAnalysis(null, events, playback, 'test');
  const zh = plan.timeline.map((item) => item.thoughtZh).join('\n');
  assert(!/\bcognitive\b|\bAdvertisement\b/i.test(zh), 'timeline should not expose internal English labels in Chinese thoughts');
  assert(!/负担变重/.test(zh), 'timeline should not use generic system-burden wording');
  const progressThoughts = plan.timeline
    .filter((item) => item.runtimeEventType === 'route_progress')
    .map((item) => item.thoughtZh);
  assert(
    new Set(progressThoughts).size === progressThoughts.length,
    'route progress thoughts should not repeat the same sentence'
  );
}

main();
console.log('validate_runtime_timeline_public_wording: ok');
