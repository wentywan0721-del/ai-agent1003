const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'sim-server.js'), 'utf8');

assert(
  serverSource.includes("'/api/background-field/prewarm'"),
  'sim-server should expose a background-field prewarm endpoint'
);

assert(
  appSource.includes('requestBackgroundFieldPrewarmForModel'),
  'app should request background-field prewarm after a model is uploaded'
);

assert(
  appSource.includes('/api/background-field/prewarm'),
  'app should call the server background-field prewarm endpoint'
);

console.log('validate_background_prewarm_upload_bridge: ok');
