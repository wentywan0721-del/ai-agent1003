const assert = require('assert');
const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');
const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /stage:\s*job\.stage\s*\|\|\s*null/.test(serverSource),
  'heatmap job snapshots should expose the current compute stage'
);

assert(
  /job\.stage\s*=\s*progress\?\.stage\s*\|\|\s*job\.stage\s*\|\|\s*null/.test(serverSource),
  'heatmap job progress updates should retain the latest stage from backend progress events'
);

assert(
  /stage:\s*null/.test(serverSource),
  'new heatmap jobs should initialize stage explicitly'
);

assert(
  /heatmapComputeStage/.test(appSource),
  'frontend should track the current heatmap compute stage'
);

assert(
  /getHeatmapComputeStatusText/.test(appSource),
  'frontend should render stage-aware heatmap compute status text'
);

assert(
  /body\?\.stage/.test(appSource),
  'frontend should read the compute stage from heatmap job polling responses'
);

console.log('validate_heatmap_job_stage_status: ok');
