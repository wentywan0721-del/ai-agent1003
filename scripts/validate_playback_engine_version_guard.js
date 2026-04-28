const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server', 'heatmap-runner.js'), 'utf8');

  assert(
    serverSource.includes("const BACKGROUND_FIELD_ENGINE_VERSION = 'background-field-v27';"),
    'server should declare the current background playback engine version'
  );
  assert(
    serverSource.includes('backgroundFieldEngineVersion: BACKGROUND_FIELD_ENGINE_VERSION'),
    'server should include the background engine version in serialized playback metadata'
  );
}

main();
console.log('validate_playback_engine_version_guard: ok');
