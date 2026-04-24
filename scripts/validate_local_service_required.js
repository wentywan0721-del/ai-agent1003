const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  source.includes('本地仿真服务 8891 未连接'),
  'app should show an explicit local sim service error when 8891 is unavailable'
);

assert(
  !source.includes('precomputedPlayback = await precomputeHeatmapPlaybackInBrowser(computeToken);'),
  'handleRunHeatmap should not silently fall back to browser-side heatmap computation'
);

console.log('validate_local_service_required: ok');
