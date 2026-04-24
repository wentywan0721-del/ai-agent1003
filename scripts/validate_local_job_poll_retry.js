const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  appJs.includes('LOCAL_SIM_SERVER_JOB_MAX_TRANSIENT_FAILURES'),
  'Expected a dedicated retry limit for local sim job polling'
);

assert(
  /function fetchHeatmapJobResult\(jobId, computeToken\) \{[\s\S]*transientFailureCount/.test(appJs),
  'Expected job polling to track transient connection failures'
);

assert(
  /if \(isLocalSimConnectionError\(error\) && transientFailureCount < LOCAL_SIM_SERVER_JOB_MAX_TRANSIENT_FAILURES\)/.test(appJs),
  'Expected transient poll connection failures to retry instead of failing immediately'
);

console.log('validate_local_job_poll_retry: ok');
