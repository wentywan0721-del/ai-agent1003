const assert = require('assert');

const runner = require('../server/heatmap-runner.js');

assert(
  runner.__private && typeof runner.__private.sanitizeGroundedTimelineText === 'function',
  'expected private sanitizeGroundedTimelineText export'
);

const sanitized = runner.__private.sanitizeGroundedTimelineText([
  {
    order: 1,
    thoughtZh: '右边电梯看起来近，我先停下来缓一下。',
    thoughtEn: 'The elevator on the right is close, so I will stop and rest.',
    cueZh: '左侧标识',
    cueEn: 'left sign',
    runtimeEventType: 'burden_spike',
    runtimeRestState: 'none',
  },
  {
    order: 2,
    thoughtZh: '有点累，停下来缓一下。',
    thoughtEn: 'I need to stop for a short rest.',
    runtimeEventType: 'short_rest_started',
    runtimeRestState: 'short-rest',
  },
]);

assert(!/[左右]边|左侧|右侧|往左|往右/.test(sanitized[0].thoughtZh), 'unsupported Chinese left/right wording should be neutralized');
assert(!/\b(left|right)\b/i.test(sanitized[0].thoughtEn), 'unsupported English left/right wording should be neutralized');
assert(!/停下来|停下|休息|歇|缓一下/.test(sanitized[0].thoughtZh), 'non-rest timeline item should not claim a stop/rest');
assert(!/\b(stop|rest|pause)\b/i.test(sanitized[0].thoughtEn), 'non-rest timeline item should not claim a stop/rest');
assert(/停下来|休息|缓一下/.test(sanitized[1].thoughtZh), 'real rest timeline item should preserve rest wording');
assert(/\b(stop|rest)\b/i.test(sanitized[1].thoughtEn), 'real rest timeline item should preserve English rest wording');

console.log('validate_llm_timeline_text_sanitization: ok');
