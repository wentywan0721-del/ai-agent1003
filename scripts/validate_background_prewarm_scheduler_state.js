const assert = require('assert');

const { createHeatmapForegroundSchedulerState } = require('../server/sim-server.js');

function main() {
  assert.strictEqual(
    typeof createHeatmapForegroundSchedulerState,
    'function',
    'sim-server should expose foreground scheduler state for prewarm gating'
  );

  const scheduler = createHeatmapForegroundSchedulerState();
  const initialGeneration = scheduler.getBackgroundFieldPrewarmGeneration();
  assert.strictEqual(scheduler.getActiveForegroundHeatmapJobCount(), 0);
  assert.strictEqual(scheduler.canRunBackgroundFieldPrewarm(initialGeneration), true);

  const firstJob = scheduler.beginForegroundHeatmapJob();
  assert.strictEqual(scheduler.getActiveForegroundHeatmapJobCount(), 1);
  assert.strictEqual(
    scheduler.getBackgroundFieldPrewarmGeneration() > initialGeneration,
    true,
    'foreground jobs should invalidate queued prewarm work'
  );
  assert.strictEqual(
    scheduler.canRunBackgroundFieldPrewarm(initialGeneration),
    false,
    'prewarm scheduled before a foreground job should not start with a stale generation'
  );
  assert.strictEqual(
    scheduler.canRunBackgroundFieldPrewarm(firstJob.generation),
    false,
    'prewarm should not run while a foreground heatmap job is active'
  );

  const secondJob = scheduler.beginForegroundHeatmapJob();
  assert.strictEqual(scheduler.getActiveForegroundHeatmapJobCount(), 2);
  scheduler.endForegroundHeatmapJob(firstJob.id);
  assert.strictEqual(
    scheduler.canRunBackgroundFieldPrewarm(secondJob.generation),
    false,
    'prewarm should stay deferred until all foreground jobs finish'
  );

  scheduler.endForegroundHeatmapJob(secondJob.id);
  assert.strictEqual(scheduler.getActiveForegroundHeatmapJobCount(), 0);
  assert.strictEqual(
    scheduler.canRunBackgroundFieldPrewarm(scheduler.getBackgroundFieldPrewarmGeneration()),
    true,
    'prewarm can resume after foreground jobs finish using the current generation'
  );
}

main();
console.log('validate_background_prewarm_scheduler_state: ok');
