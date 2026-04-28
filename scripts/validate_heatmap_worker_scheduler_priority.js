const assert = require('assert');

const {
  createBackgroundPrewarmDeferredError,
  createHeatmapWorkerScheduler,
  isBackgroundPrewarmDeferredError,
} = require('../server/sim-server.js');

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function main() {
  assert.strictEqual(
    typeof createHeatmapWorkerScheduler,
    'function',
    'sim-server should expose a heatmap worker scheduler'
  );

  const scheduler = createHeatmapWorkerScheduler({
    foregroundConcurrency: 1,
    backgroundConcurrency: 1,
  });
  const events = [];
  const foregroundOne = deferred();
  const foregroundTwo = deferred();
  const backgroundOne = deferred();

  const first = scheduler.schedule(() => {
    events.push('foreground-1:start');
    return { promise: foregroundOne.promise };
  }, { priority: 'foreground' });
  scheduler.schedule(() => {
    events.push('background-1:start');
    return { promise: backgroundOne.promise };
  }, { priority: 'background' });
  const second = scheduler.schedule(() => {
    events.push('foreground-2:start');
    return { promise: foregroundTwo.promise };
  }, { priority: 'foreground' });

  await Promise.resolve();
  assert.deepStrictEqual(
    events,
    ['foreground-1:start'],
    'background work should not start while foreground work is active or queued'
  );

  foregroundOne.resolve('done-1');
  await first.promise;
  await Promise.resolve();
  assert.deepStrictEqual(
    events,
    ['foreground-1:start', 'foreground-2:start'],
    'queued foreground work should run before background work'
  );

  foregroundTwo.resolve('done-2');
  await second.promise;
  await Promise.resolve();
  assert.deepStrictEqual(
    events,
    ['foreground-1:start', 'foreground-2:start', 'background-1:start'],
    'background work should resume after all foreground work is complete'
  );

  backgroundOne.resolve('done-background');
  await scheduler.idle();

  const blocker = deferred();
  const foregroundBlocker = scheduler.schedule(() => {
    events.push('foreground-blocker:start');
    return { promise: blocker.promise };
  }, { priority: 'foreground' });
  const queuedBackground = scheduler.schedule(() => {
    events.push('background-cancelled:start');
    return { promise: Promise.resolve() };
  }, { priority: 'background' });
  await Promise.resolve();
  queuedBackground.cancel(createBackgroundPrewarmDeferredError());
  await assert.rejects(
    queuedBackground.promise,
    isBackgroundPrewarmDeferredError,
    'queued background prewarm should be cancellable before it starts'
  );
  blocker.resolve('done-blocker');
  await foregroundBlocker.promise;
  await scheduler.idle();
}

main()
  .then(() => {
    console.log('validate_heatmap_worker_scheduler_priority: ok');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
