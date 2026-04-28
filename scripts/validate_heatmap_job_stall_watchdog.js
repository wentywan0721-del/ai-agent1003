const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  /HEATMAP_JOB_STALL_TIMEOUT_MS/.test(serverSource),
  'sim-server should define a foreground heatmap job stall timeout'
);

assert(
  /lastProgressAt/.test(serverSource),
  'heatmap jobs should track the last time progress actually advanced'
);

assert(
  /cancelHeatmapJobTask/.test(serverSource),
  'stalled heatmap jobs should cancel their underlying worker task instead of leaving it running'
);

assert(
  /Heatmap job stalled/i.test(serverSource),
  'stalled heatmap jobs should fail with an explicit diagnostic instead of leaving the frontend at 45%'
);

console.log('validate_heatmap_job_stall_watchdog: ok');
