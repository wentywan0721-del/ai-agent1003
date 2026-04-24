const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const appSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

  assert(
    appSource.includes('EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION'),
    'app should declare an expected background playback engine version'
  );
  assert(
    appSource.includes('当前热力图回放版本已过期，请点击“刷新热力图”。'),
    'app should show an explicit stale playback warning'
  );
  assert(
    serverSource.includes('engineVersion: BACKGROUND_FIELD_ENGINE_VERSION'),
    'server should include engineVersion in serialized playback metadata'
  );
}

main();
console.log('validate_playback_engine_version_guard: ok');
