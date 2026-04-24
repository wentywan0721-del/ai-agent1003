const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

  assert(
    source.includes("engineVersion: playback?.meta?.engineVersion || null"),
    'attachHeatmapSourceMeta must not silently upgrade local playback without an engineVersion'
  );

  assert(
    !source.includes("engineVersion: playback?.meta?.engineVersion || EXPECTED_BACKGROUND_FIELD_ENGINE_VERSION"),
    'stale local cache is being incorrectly marked as current'
  );
}

main();
console.log('validate_stale_local_cache_not_upgraded: ok');
