const assert = require('assert');

const runner = require('../server/heatmap-runner.js');

assert(
  runner.__private && typeof runner.__private.sanitizeGroundedTimelineText === 'function',
  'expected private sanitizeGroundedTimelineText export'
);

const sanitized = runner.__private.sanitizeGroundedTimelineText([
  {
    order: 1,
    thoughtZh: '我先停下来缓一下。',
    thoughtEn: 'I should stop and rest.',
    runtimeEventType: 'burden_spike',
    runtimeRestState: 'none',
    walkingSpeed: 0.28,
  },
  {
    order: 2,
    thoughtZh: '我先停下来看看标识。',
    thoughtEn: 'I stop to check the sign.',
    runtimeEventType: 'guidance_pause',
    runtimeRestState: 'none',
    walkingSpeed: 0,
  },
  {
    order: 3,
    thoughtZh: '我先停下来休息一下。',
    thoughtEn: 'I stop for a short rest.',
    runtimeEventType: 'short_rest_started',
    runtimeRestState: 'short-rest',
    walkingSpeed: 0,
  },
]);

assert(!/停下来|停下|休息|缓一下/.test(sanitized[0].thoughtZh), 'moving/slow timeline item must not claim stopping or resting');
assert(!/\b(stop|rest|pause)\b/i.test(sanitized[0].thoughtEn), 'moving/slow timeline item must not claim stop/rest/pause in English');
assert(/停下来.*标识/.test(sanitized[1].thoughtZh), 'real zero-speed guidance pause may say stopping to check signage');
assert(/\bstop\b.*\bsign\b/i.test(sanitized[1].thoughtEn), 'real zero-speed guidance pause may say stopping to check signage in English');
assert(/休息/.test(sanitized[2].thoughtZh), 'real rest event should preserve rest wording');
assert(/\brest\b/i.test(sanitized[2].thoughtEn), 'real rest event should preserve rest wording in English');

console.log('validate_llm_timeline_motion_wording: ok');
