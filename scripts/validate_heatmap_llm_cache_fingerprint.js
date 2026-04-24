const assert = require('assert');

function loadRunner() {
  delete require.cache[require.resolve('../server/heatmap-runner.js')];
  return require('../server/heatmap-runner.js');
}

function main() {
  const originalEnv = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  };

  try {
    process.env.OPENAI_API_KEY = '';
    process.env.OPENAI_MODEL = '';
    process.env.OPENAI_BASE_URL = '';
    const runnerWithoutLlm = loadRunner();
    const noLlmFingerprint = runnerWithoutLlm.buildHeatmapRequestFingerprint({
      scenarioOptions: { focusRouteId: 'route1', backgroundCrowdCount: 500 },
      heatOptions: { maxSimulationSeconds: 60 },
    }, { rootDir: require('path').join(__dirname, '..') });

    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'deepseek-chat';
    process.env.OPENAI_BASE_URL = 'https://api.deepseek.com';
    const runnerWithLlm = loadRunner();
    const withLlmFingerprint = runnerWithLlm.buildHeatmapRequestFingerprint({
      scenarioOptions: { focusRouteId: 'route1', backgroundCrowdCount: 500 },
      heatOptions: { maxSimulationSeconds: 60 },
    }, { rootDir: require('path').join(__dirname, '..') });

    assert.notDeepStrictEqual(
      noLlmFingerprint,
      withLlmFingerprint,
      'heatmap request fingerprint should change when LLM provider configuration changes'
    );

    assert(
      JSON.stringify(withLlmFingerprint).includes('deepseek-chat')
      && JSON.stringify(withLlmFingerprint).includes('api.deepseek.com'),
      'heatmap request fingerprint should retain the active LLM provider signature'
    );
  } finally {
    process.env.OPENAI_API_KEY = originalEnv.OPENAI_API_KEY;
    process.env.OPENAI_MODEL = originalEnv.OPENAI_MODEL;
    process.env.OPENAI_BASE_URL = originalEnv.OPENAI_BASE_URL;
    loadRunner();
  }
}

main();
console.log('validate_heatmap_llm_cache_fingerprint: ok');
