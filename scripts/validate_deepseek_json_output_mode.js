const assert = require('assert');

const {
  __private: {
    buildChatCompletionRequestBody,
  },
} = require('../server/llm-decision-plan.js');

assert.strictEqual(
  typeof buildChatCompletionRequestBody,
  'function',
  'Expected llm-decision-plan to expose buildChatCompletionRequestBody for validation'
);

const deepseekBody = buildChatCompletionRequestBody(
  { model: 'deepseek-chat' },
  { id: 'deepseek', requestLabel: 'DeepSeek' },
  { request: { startNodeId: 'node-a', targetRegionId: 'exit-a' } }
);

assert.strictEqual(deepseekBody.model, 'deepseek-chat', 'Expected request builder to keep the provider model');
assert(
  deepseekBody.response_format && deepseekBody.response_format.type === 'json_object',
  'Expected DeepSeek chat-completions requests to enable JSON Output mode'
);
assert.strictEqual(deepseekBody.stream, false, 'Expected chat-completions request builder to keep streaming disabled');

const genericBody = buildChatCompletionRequestBody(
  { model: 'some-chat-model' },
  { id: 'other', requestLabel: 'Other' },
  { request: { startNodeId: 'node-a', targetRegionId: 'exit-a' } }
);

assert(
  !Object.prototype.hasOwnProperty.call(genericBody, 'response_format'),
  'Expected non-DeepSeek chat-completions requests not to force DeepSeek-specific JSON mode'
);

console.log('validate_deepseek_json_output_mode: ok');
