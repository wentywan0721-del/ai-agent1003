const assert = require('assert');

const { resolveMonotonicJobProgress } = require('../server/sim-server.js');

function main() {
  assert.strictEqual(
    typeof resolveMonotonicJobProgress,
    'function',
    'sim-server should expose monotonic job progress resolution'
  );

  assert.strictEqual(
    resolveMonotonicJobProgress(0.94, 0.52),
    0.94,
    'later lower stage progress must not pull displayed progress backward'
  );

  assert.strictEqual(
    resolveMonotonicJobProgress(0.45, 0.61),
    0.61,
    'higher next progress should still advance normally'
  );
}

main();
console.log('validate_heatmap_job_progress_monotonic: ok');
