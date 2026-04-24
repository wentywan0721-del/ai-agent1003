const assert = require('assert');

const originalEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
};
const originalFetch = global.fetch;

async function main() {
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_BASE_URL = 'https://api.deepseek.com';
  process.env.OPENAI_MODEL = 'deepseek-chat';

  let attempts = 0;
  const requestBodies = [];
  global.fetch = async (_url, options = {}) => {
    attempts += 1;
    requestBodies.push(JSON.parse(String(options.body || '{}')));
    if (attempts === 1) {
      return {
        ok: false,
        status: 504,
        json: async () => ({ error: { message: 'gateway timeout' } }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{
          message: {
            content: '```json\n{"summary_zh":"已生成","summary_en":"Ready","route_style":{"crowd_avoidance_bias":0.91,"wall_avoidance_bias":0.63,"centerline_bias":0.54},"decisions":[]}\n```',
          },
        }],
      }),
    };
  };

  delete require.cache[require.resolve('../server/llm-decision-plan.js')];
  const { requestLlmDecisionPlan } = require('../server/llm-decision-plan.js');
  const result = await requestLlmDecisionPlan({
    request: { startNodeId: 'a', targetRegionId: 'b' },
    agent: { walkingSpeed: 0.9 },
    routeStyleHint: { crowdAvoidanceBias: 0.4 },
    decisionPoints: [],
  });

  assert.strictEqual(attempts, 2, 'Expected DeepSeek request to retry once after a 504 failure');
  assert.strictEqual(result.connected, true, 'Expected retry-success result to be connected');
  assert.strictEqual(result.provider.id, 'deepseek', 'Expected DeepSeek provider metadata');
  assert(result.analysis && result.analysis.routeStyle, 'Expected retry-success result to include routeStyle');
  assert.strictEqual(Array.isArray(result.analysis.decisions), true, 'Expected retry-success result to preserve decisions array');
  assert.strictEqual(result.analysis.decisions.length, 0, 'Expected empty decisions array to remain valid');
  assert.strictEqual('response_format' in requestBodies[0], false, 'Expected DeepSeek chat-completions request to avoid response_format JSON mode');

  console.log('validate_llm_decision_plan_deepseek_retry: ok');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    global.fetch = originalFetch;
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });
