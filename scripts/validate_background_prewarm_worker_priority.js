const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const rootDir = path.join(__dirname, '..');
  const serverSource = fs.readFileSync(path.join(rootDir, 'server', 'sim-server.js'), 'utf8');
  const workerSource = fs.readFileSync(path.join(rootDir, 'server', 'heatmap-sim-worker.js'), 'utf8');

  assert(
    workerSource.includes('prewarmBackgroundField'),
    'heatmap worker should support background-field prewarm tasks'
  );
  assert(
    workerSource.includes("taskType === 'background-prewarm'"),
    'heatmap worker should branch to the background prewarm runner'
  );
  assert(
    serverSource.includes('runBackgroundFieldPrewarmInWorker'),
    'sim-server should run background prewarm outside the main event loop'
  );
  assert(
    serverSource.includes('terminateActiveBackgroundFieldPrewarmWorker'),
    'sim-server should be able to cancel active background prewarm when foreground work arrives'
  );
  assert(
    serverSource.includes('beginForegroundHeatmapJob()'),
    'foreground heatmap jobs should mark foreground priority before async simulation starts'
  );
}

main();
console.log('validate_background_prewarm_worker_priority: ok');
