const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  !appSource.includes('maxSimulationSeconds: 60'),
  'local heatmap service request should not truncate playback with a 60-second hard limit'
);

assert(
  appSource.includes('maxSimulationSeconds: 120'),
  'local heatmap service request should allow at least 120 seconds so longer custom routes can finish'
);

console.log('validate_local_heatmap_time_budget: ok');
