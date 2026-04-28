const assert = require('assert');

const { resolveHeatmapWorkerPoolOptions } = require('../server/sim-server.js');

function main() {
  assert.strictEqual(
    typeof resolveHeatmapWorkerPoolOptions,
    'function',
    'sim-server should expose heatmap worker pool option resolution'
  );

  const defaults = resolveHeatmapWorkerPoolOptions({}, { cpuCount: 4 });
  assert.strictEqual(
    defaults.foregroundConcurrency,
    2,
    'default foreground pool should keep multiple workers available without consuming every CPU'
  );
  assert.strictEqual(defaults.backgroundConcurrency, 1, 'background prewarm should stay low concurrency');

  const overridden = resolveHeatmapWorkerPoolOptions({
    heatmapForegroundWorkers: 3,
    heatmapBackgroundWorkers: 2,
  }, { cpuCount: 8 });
  assert.strictEqual(overridden.foregroundConcurrency, 3);
  assert.strictEqual(overridden.backgroundConcurrency, 2);

  const clamped = resolveHeatmapWorkerPoolOptions({
    heatmapForegroundWorkers: 0,
    heatmapBackgroundWorkers: -1,
  }, { cpuCount: 2 });
  assert.strictEqual(clamped.foregroundConcurrency >= 1, true);
  assert.strictEqual(clamped.backgroundConcurrency, 1);
}

main();
console.log('validate_heatmap_worker_pool_options: ok');
