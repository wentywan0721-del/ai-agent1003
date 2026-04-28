const assert = require('assert');

const runner = require('../server/heatmap-runner.js');

assert(
  runner.__private && typeof runner.__private.buildRuntimeFallbackDecisionPlanAnalysis === 'function',
  'expected private buildRuntimeFallbackDecisionPlanAnalysis export'
);

const analysis = runner.__private.buildRuntimeFallbackDecisionPlanAnalysis(
  { id: 'deepseek', label: 'DeepSeek', status: 'invalid json', connected: false },
  [
    {
      eventId: 'guidance_pause_001',
      type: 'guidance_pause',
      node_id: 'gate_in_2',
      timeSeconds: 12,
      progress: 0.2,
      restState: 'none',
      walkingSpeed: 0,
    },
    {
      eventId: 'route_completed_002',
      type: 'route_completed',
      node_id: 'lift_1',
      timeSeconds: 80,
      progress: 1,
      restState: 'none',
    },
  ],
  {
    traceSnapshots: [
      { time: 0, progress: 0 },
      { time: 80, progress: 1 },
    ],
    summary: { duration: 80 },
  },
  'Unexpected token'
);

assert.strictEqual(analysis.analysisKind, 'decision-plan');
assert.strictEqual(analysis.failed, false, 'runtime fallback should still be displayable');
assert.strictEqual(analysis.fallback, true, 'runtime fallback should be marked');
assert(analysis.timeline.length >= 2, 'runtime fallback should provide timeline entries');
assert(
  analysis.timeline.every((item, index) => item.order === index + 1 && item.timeSeconds !== null && item.progress !== null),
  'runtime fallback timeline should be ordered and time/progress grounded'
);
assert(
  analysis.timeline.some((item) => item.triggerEventType === 'guidance_pause'),
  'runtime fallback should preserve runtime event triggers for playback highlight'
);

console.log('validate_llm_runtime_fallback_decision_chain: ok');
