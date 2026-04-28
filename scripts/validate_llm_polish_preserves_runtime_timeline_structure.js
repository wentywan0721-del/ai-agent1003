const assert = require('assert');

const {
  __private: {
    applyPolishedTextToRuntimeTimeline,
  },
} = require('../server/heatmap-runner.js');

assert.strictEqual(
  typeof applyPolishedTextToRuntimeTimeline,
  'function',
  'applyPolishedTextToRuntimeTimeline should be exported for regression validation'
);

const runtimeTimeline = [
  {
    order: 1,
    nodeId: 'gate_in_1',
    phase: 'route_started',
    timeSeconds: 0,
    progress: 0,
    runtimeEventType: 'route_started',
    runtimeRestState: 'none',
    triggerKind: 'runtime_event',
    triggerEventId: 'route_started_000',
    triggerEventType: 'route_started',
    triggerRestState: 'none',
    walkingSpeed: 0.72,
    thoughtZh: 'runtime start zh',
    thoughtEn: 'runtime start en',
    cueZh: 'runtime start cue zh',
    cueEn: 'runtime start cue en',
  },
  {
    order: 2,
    nodeId: 'sign_2',
    phase: 'guidance_pause',
    timeSeconds: 18.25,
    progress: 0.22,
    runtimeEventType: 'guidance_pause',
    runtimeRestState: 'none',
    triggerKind: 'runtime_event',
    triggerEventId: 'guidance_pause_018',
    triggerEventType: 'guidance_pause',
    triggerRestState: 'none',
    walkingSpeed: 0,
    thoughtZh: 'runtime sign zh',
    thoughtEn: 'runtime sign en',
    cueZh: 'runtime sign cue zh',
    cueEn: 'runtime sign cue en',
  },
  {
    order: 3,
    nodeId: 'seat_1',
    phase: 'seat_rest_started',
    timeSeconds: 77.5,
    progress: 0.61,
    runtimeEventType: 'seat_rest_started',
    runtimeRestState: 'sitting',
    triggerKind: 'runtime_event',
    triggerEventId: 'seat_rest_077',
    triggerEventType: 'seat_rest_started',
    triggerRestState: 'sitting',
    walkingSpeed: 0,
    thoughtZh: 'runtime seat zh',
    thoughtEn: 'runtime seat en',
    cueZh: 'runtime seat cue zh',
    cueEn: 'runtime seat cue en',
  },
];

const invalidLlmTimeline = [
  {
    order: 99,
    nodeId: 'wrong_node',
    phase: 'route_completed',
    timeSeconds: 999,
    progress: 1,
    runtimeEventType: 'route_completed',
    runtimeRestState: 'none',
    triggerEventId: 'seat_rest_077',
    triggerEventType: 'route_completed',
    thoughtZh: 'LLM polished seat zh',
    thoughtEn: 'LLM polished seat en',
    cueZh: 'LLM polished seat cue zh',
    cueEn: 'LLM polished seat cue en',
  },
  {
    order: 1,
    nodeId: 'wrong_start',
    phase: 'progress',
    timeSeconds: 44,
    progress: 0.8,
    runtimeEventType: 'burden_spike',
    triggerEventId: 'route_started_000',
    thoughtZh: 'LLM polished start zh',
    thoughtEn: 'LLM polished start en',
  },
  {
    order: 2,
    nodeId: 'wrong_sign',
    phase: 'progress',
    timeSeconds: 50,
    progress: 0.4,
    triggerEventId: 'guidance_pause_018',
    thoughtZh: '',
    thoughtEn: 'LLM polished sign en',
  },
];

const merged = applyPolishedTextToRuntimeTimeline(runtimeTimeline, invalidLlmTimeline);

assert.strictEqual(merged.length, runtimeTimeline.length, 'polished timeline must keep runtime item count');

for (let index = 0; index < runtimeTimeline.length; index += 1) {
  const expected = runtimeTimeline[index];
  const actual = merged[index];
  [
    'order',
    'nodeId',
    'phase',
    'timeSeconds',
    'progress',
    'runtimeEventType',
    'runtimeRestState',
    'triggerKind',
    'triggerEventId',
    'triggerEventType',
    'triggerRestState',
    'walkingSpeed',
  ].forEach((key) => {
    assert.deepStrictEqual(
      actual[key],
      expected[key],
      `LLM polish must not change runtime field ${key} for item ${index + 1}`
    );
  });
}

assert.strictEqual(merged[0].thoughtZh, 'LLM polished start zh');
assert.strictEqual(merged[0].thoughtEn, 'LLM polished start en');
assert.strictEqual(merged[1].thoughtZh, 'runtime sign zh', 'blank LLM text must not erase runtime fallback text');
assert.strictEqual(merged[1].thoughtEn, 'LLM polished sign en');
assert.strictEqual(merged[2].thoughtZh, 'LLM polished seat zh');
assert.strictEqual(merged[2].thoughtEn, 'LLM polished seat en');

console.log('validate_llm_polish_preserves_runtime_timeline_structure: ok');
