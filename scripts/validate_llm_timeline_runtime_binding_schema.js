const assert = require('assert');

const llm = require('../server/llm-decision-plan.js');

assert(
  llm.__private && typeof llm.__private.buildDecisionPlanSchema === 'function',
  'expected private buildDecisionPlanSchema export'
);
assert(
  typeof llm.__private.buildDecisionPlanSystemPrompt === 'function',
  'expected private buildDecisionPlanSystemPrompt export'
);
assert(
  typeof llm.__private.buildDecisionPlanUserPrompt === 'function',
  'expected private buildDecisionPlanUserPrompt export'
);

const schema = llm.__private.buildDecisionPlanSchema();
const timelineProperties = schema.properties.timeline.items.properties;

assert(timelineProperties.time_seconds, 'timeline schema should allow explicit time_seconds grounding');
assert(timelineProperties.progress, 'timeline schema should allow explicit progress grounding');
assert(timelineProperties.runtime_event_type, 'timeline schema should allow explicit runtime_event_type grounding');
assert(timelineProperties.runtime_rest_state, 'timeline schema should allow explicit runtime_rest_state grounding');
assert(timelineProperties.trigger_event_id, 'timeline schema should allow explicit trigger_event_id grounding');

const systemPrompt = llm.__private.buildDecisionPlanSystemPrompt();
const userPrompt = llm.__private.buildDecisionPlanUserPrompt({
  runtimeEvents: [
    { eventId: 'short_rest_started_001', type: 'short_rest_started', timeSeconds: 12, progress: 0.2, restState: 'short-rest' },
  ],
});

assert(
  /runtime_event_type/.test(systemPrompt) && /runtime_rest_state/.test(systemPrompt),
  'system prompt should require timeline items to bind to runtime events when describing runtime behavior'
);
assert(
  /trigger_event_id/.test(userPrompt),
  'user prompt should show trigger_event_id in the required JSON example'
);
assert(
  /left\/right/i.test(systemPrompt) || /left or right/i.test(systemPrompt),
  'system prompt should explicitly restrict unverified left/right wording'
);

const repaired = llm.parseDecisionPlanJson('{"summary_zh":"ok","timeline":[{"order":}]}');
assert(
  Array.isArray(repaired.timeline) && repaired.timeline.length === 1,
  'LLM parser should recover malformed missing primitive values instead of failing the whole decision chain'
);
assert.strictEqual(repaired.timeline[0].order, null, 'missing primitive repair should use null');

console.log('validate_llm_timeline_runtime_binding_schema: ok');
