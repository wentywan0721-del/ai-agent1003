const assert = require('assert');
const Runner = require('../server/heatmap-runner.js');

function snapshot(index, overrides = {}) {
  const progress = index / 10;
  return {
    time: index * 30,
    progress,
    x: progress * 100,
    y: 10 + index,
    currentWalkingSpeed: 0.55,
    fatigue: 20 + index * 3,
    fatigueThreshold: 100,
    restState: 'none',
    topBurdenId: 'sensory',
    burdenScores: {
      locomotor: 35,
      sensory: 35,
      cognitive: 35,
      psychological: 35,
      vitality: 35,
    },
    topPressureSources: [],
    ...overrides,
  };
}

function main() {
  const playback = {
    traceSnapshots: [
      snapshot(0),
      snapshot(1, {
        burdenScores: { locomotor: 62, sensory: 35, cognitive: 35, psychological: 35, vitality: 38 },
        topBurdenId: 'locomotor',
        topPressureSources: [{ id: 'crowd_1', name: 'Crowd Density', category: 'crowd', score: 62 }],
      }),
      snapshot(2, {
        burdenScores: { locomotor: 64, sensory: 61, cognitive: 35, psychological: 35, vitality: 42 },
        topBurdenId: 'sensory',
        topPressureSources: [{ id: 'light_1', name: 'Lighting', category: 'lighting', feature: 'bright light', score: 65 }],
      }),
      snapshot(3, {
        burdenScores: { locomotor: 66, sensory: 76, cognitive: 35, psychological: 35, vitality: 48 },
        topBurdenId: 'sensory',
        topPressureSources: [{ id: 'noise_1', name: 'Escalator Noise', category: 'noise', feature: 'Noise level 82 decibels', score: 76 }],
      }),
      snapshot(4, {
        currentWalkingSpeed: 0.3,
        burdenScores: { locomotor: 78, sensory: 50, cognitive: 35, psychological: 35, vitality: 56 },
        topBurdenId: 'locomotor',
        topPressureSources: [{ id: 'queue_1', name: 'Queue', category: 'queue', score: 78 }],
      }),
      snapshot(5, {
        burdenScores: { locomotor: 55, sensory: 48, cognitive: 76, psychological: 35, vitality: 61 },
        topBurdenId: 'cognitive',
        decisionDiagnostics: { decisionNodeId: 'sign_1', branchCount: 2, recheckProbability: 0.35, guideReviewPauseTime: 1.1 },
        topPressureSources: [{ id: 'sign_1', name: 'Common direction Signs', category: 'signage', score: 76 }],
      }),
      snapshot(6, {
        restState: 'searching',
        burdenScores: { locomotor: 52, sensory: 45, cognitive: 55, psychological: 78, vitality: 82 },
        topBurdenId: 'psychological',
        nearbySeats: [{ id: 'seat_1', distance: 3.5 }],
        topPressureSources: [{ id: 'crowd_2', name: 'Crowd Pressure', category: 'crowd', score: 78 }],
      }),
      snapshot(7, {
        restState: 'sitting',
        burdenScores: { locomotor: 45, sensory: 40, cognitive: 45, psychological: 55, vitality: 88 },
        topBurdenId: 'vitality',
      }),
      snapshot(8, {
        restState: 'none',
        burdenScores: { locomotor: 45, sensory: 40, cognitive: 45, psychological: 48, vitality: 45 },
        topBurdenId: 'vitality',
      }),
      snapshot(9, {
        burdenScores: { locomotor: 44, sensory: 38, cognitive: 42, psychological: 45, vitality: 62 },
        topBurdenId: 'vitality',
      }),
      snapshot(10, {
        progress: 1,
        playbackComplete: true,
        currentWalkingSpeed: 0,
        burdenScores: { locomotor: 42, sensory: 35, cognitive: 38, psychological: 40, vitality: 70 },
        topBurdenId: 'vitality',
      }),
    ],
  };

  const events = Runner.__private.buildRuntimeEventsFromPlayback(playback);
  const types = events.map((event) => event.type);
  assert(types.includes('slow_walk'), 'expected slow walking event');
  assert(types.includes('seat_search_started'), 'expected seat search event');
  assert(types.includes('seat_rest_started'), 'expected sitting rest event');
  assert(types.includes('rest_resumed'), 'expected rest resumed event');
  assert(types.includes('route_completed'), 'expected route completion event');

  const burdenEvents = events.filter((event) => event.type === 'burden_spike');
  ['locomotor', 'sensory', 'cognitive', 'psychological', 'vitality'].forEach((dimension) => {
    assert(
      burdenEvents.some((event) => event.dimension === dimension),
      `expected burden event for ${dimension}`
    );
  });
  assert(
    burdenEvents.some((event) => event.dimension === 'sensory' && event.threshold === 60),
    'expected moderate sensory threshold event'
  );
  assert(
    burdenEvents.some((event) => event.dimension === 'sensory' && event.threshold === 75),
    'expected high sensory threshold event'
  );

  const plan = Runner.__private.buildRuntimeFallbackDecisionPlanAnalysis(null, events, playback, 'test');
  assert(plan.timeline.length >= 12, 'expected a denser timeline for a long eventful playback');
  const phases = plan.timeline.map((item) => item.phase);
  ['slow_walk', 'seat_search_started', 'seat_rest_started', 'rest_resumed', 'route_completed'].forEach((phase) => {
    assert(phases.includes(phase), `expected timeline to retain ${phase}`);
  });
  assert(
    plan.timeline.every((item, index, list) => index === 0 || item.timeSeconds >= list[index - 1].timeSeconds),
    'timeline should stay time ordered'
  );
}

main();
console.log('validate_llm_runtime_event_completeness: ok');
