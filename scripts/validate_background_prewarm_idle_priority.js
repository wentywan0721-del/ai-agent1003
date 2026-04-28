const assert = require('assert');

const { shouldRunBackgroundFieldPrewarm } = require('../server/sim-server.js');

function main() {
  assert.strictEqual(
    typeof shouldRunBackgroundFieldPrewarm,
    'function',
    'sim-server should expose prewarm scheduling guard'
  );

  assert.strictEqual(
    shouldRunBackgroundFieldPrewarm(0),
    true,
    'prewarm may run only when no foreground heatmap job is active'
  );

  assert.strictEqual(
    shouldRunBackgroundFieldPrewarm(1),
    false,
    'prewarm should defer while a foreground heatmap job is active'
  );
}

main();
console.log('validate_background_prewarm_idle_priority: ok');
