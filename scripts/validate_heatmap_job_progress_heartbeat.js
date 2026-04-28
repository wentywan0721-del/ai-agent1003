const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  /function hasHeatmapJobProgressHeartbeat\s*\(progress\)/.test(serverSource),
  'sim-server should distinguish real worker progress heartbeats from empty progress payloads'
);

assert(
  /if\s*\(hasHeatmapJobProgressHeartbeat\(progress\)\)\s*\{[\s\S]*?job\.lastProgressAt\s*=\s*job\.updatedAt;[\s\S]*?\}/.test(serverSource),
  'heatmap jobs should refresh lastProgressAt on real progress heartbeats even when the visible percent is not increasing'
);

assert(
  /nextProgress\s*>\s*previousProgress\s*\+\s*1e-6/.test(serverSource),
  'visible heatmap job progress should remain monotonic and only increase when mapped progress advances'
);

console.log('validate_heatmap_job_progress_heartbeat: ok');
