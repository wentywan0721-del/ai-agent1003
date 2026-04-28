const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS = 120000;/.test(appSource),
  'heatmap job requests should have a dedicated long timeout for busy local simulations'
);

assert(
  /fetchJson\(getLocalSimServerUrl\(`\/api\/heatmap\/jobs\/\$\{encodeURIComponent\(jobId\)\}`\), \{\}, LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS\)/.test(appSource),
  'heatmap job polling should use the long heatmap request timeout'
);

assert(
  /fetchJson\(getLocalSimServerUrl\('\/api\/heatmap\/jobs'\), \{[\s\S]*?body: JSON\.stringify\(payload\),[\s\S]*?\}, LOCAL_SIM_SERVER_HEATMAP_REQUEST_TIMEOUT_MS\)/.test(appSource),
  'heatmap job creation should use the long heatmap request timeout'
);

console.log('validate_heatmap_job_uses_long_request_timeout: ok');
