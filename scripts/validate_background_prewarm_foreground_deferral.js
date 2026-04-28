const assert = require('assert');

const {
  createBackgroundPrewarmDeferredError,
  isBackgroundPrewarmDeferredError,
} = require('../server/sim-server.js');

function main() {
  assert.strictEqual(
    typeof createBackgroundPrewarmDeferredError,
    'function',
    'sim-server should expose a typed background prewarm deferral error'
  );
  assert.strictEqual(
    typeof isBackgroundPrewarmDeferredError,
    'function',
    'sim-server should expose a background prewarm deferral guard'
  );

  const error = createBackgroundPrewarmDeferredError();
  assert.strictEqual(
    isBackgroundPrewarmDeferredError(error),
    true,
    'prewarm deferral error should be identifiable for requeueing'
  );
}

main();
console.log('validate_background_prewarm_foreground_deferral: ok');
