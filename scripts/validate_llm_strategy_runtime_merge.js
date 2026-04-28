const assert = require('assert');

const Runner = require('../server/heatmap-runner.js');

function main() {
  assert.strictEqual(typeof Runner.__private.normalizeRouteStyleForSimulation, 'function');
  assert.strictEqual(typeof Runner.__private.mergePreRuntimePlanWithRuntimeTimeline, 'function');

  const fallbackRouteStyle = {
    crowdAvoidanceBias: 0.2,
    wallAvoidanceBias: 0.3,
    centerlineBias: 0.4,
    turnCommitmentBias: 0.5,
    hesitationBias: 0.6,
  };
  const normalized = Runner.__private.normalizeRouteStyleForSimulation({
    crowdAvoidanceBias: 2,
    wallAvoidanceBias: -1,
    centerlineBias: 0.77,
    turnCommitmentBias: 0.88,
    hesitationBias: 0.99,
  }, fallbackRouteStyle);
  assert.deepStrictEqual(normalized, {
    crowdAvoidanceBias: 1,
    wallAvoidanceBias: 0,
    centerlineBias: 0.77,
    turnCommitmentBias: 0.88,
    hesitationBias: 0.99,
  });

  const preRuntimePlan = {
    analysisKind: 'decision-plan',
    provider: { id: 'deepseek', label: 'DeepSeek', connected: true },
    routeStyle: normalized,
    decisions: [{ order: 1, decisionNodeId: 'gate_in_4', chosenTargetNodeId: 'lift_1' }],
    timeline: [{
      order: 1,
      nodeId: 'wrong',
      runtimeEventType: null,
      thoughtZh: '我先停下来休息一下。',
      thoughtEn: 'I will stop for a rest.',
    }],
  };
  const runtimeFallback = {
    provider: { id: 'runtime-fallback', label: 'Runtime Events', connected: false },
    timeline: [
      { order: 1, runtimeEventType: 'route_started', triggerEventType: 'route_started', thoughtZh: 'start' },
      { order: 2, runtimeEventType: 'slow_walk', triggerEventType: 'slow_walk', thoughtZh: 'slow' },
      { order: 3, runtimeEventType: 'route_completed', triggerEventType: 'route_completed', thoughtZh: 'done' },
    ],
  };
  const merged = Runner.__private.mergePreRuntimePlanWithRuntimeTimeline(preRuntimePlan, runtimeFallback);
  assert.deepStrictEqual(merged.routeStyle, normalized);
  assert.deepStrictEqual(merged.decisions, preRuntimePlan.decisions);
  assert.strictEqual(merged.provider.id, 'deepseek');
  assert.deepStrictEqual(merged.timeline.map((item) => item.runtimeEventType), ['route_started', 'slow_walk', 'route_completed']);
  assert(!merged.timeline.some((item) => String(item.thoughtZh || '').includes('停下来休息')));
  assert.strictEqual(merged.runtimeGrounded, true);
}

main();
console.log('validate_llm_strategy_runtime_merge: ok');
