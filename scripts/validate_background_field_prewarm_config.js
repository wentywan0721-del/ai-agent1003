const assert = require('assert');

const {
  DEFAULT_BACKGROUND_FIELD_PREWARM_BUCKETS,
  resolveBackgroundFieldPrewarmOptions,
} = require('../server/sim-server.js');

function main() {
  assert.deepStrictEqual(
    DEFAULT_BACKGROUND_FIELD_PREWARM_BUCKETS,
    [500, 1000, 1500, 2000],
    'sim-server should prewarm the fixed background crowd buckets'
  );

  const disabledByDefault = resolveBackgroundFieldPrewarmOptions();
  assert.strictEqual(disabledByDefault.enabled, false, 'background prewarm should stay opt-in for embedded/test server usage');

  const enabled = resolveBackgroundFieldPrewarmOptions({
    backgroundFieldPrewarm: true,
  });
  assert.strictEqual(enabled.enabled, true, 'background prewarm should enable when explicitly requested');
  assert.deepStrictEqual(
    enabled.buckets,
    [500, 1000, 1500, 2000],
    'default prewarm buckets should remain fixed'
  );

  const disabled = resolveBackgroundFieldPrewarmOptions({
    backgroundFieldPrewarm: false,
  });
  assert.strictEqual(disabled.enabled, false, 'explicit server option should disable startup prewarm');
}

main();
console.log('validate_background_field_prewarm_config: ok');
