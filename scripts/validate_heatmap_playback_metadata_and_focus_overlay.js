const assert = require('assert');
const fs = require('fs');
const path = require('path');

function main() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

  assert(
    source.includes("engineVersion: playback?.meta?.engineVersion || null"),
    'heatmap playback metadata must preserve missing engineVersion so stale cache can be rejected'
  );

  assert(
    source.includes("const renderDynamicAgentsInWebgl = target === elements.overlayLayer && shouldRenderDynamicCrowdWithWebgl();"),
    'only the main overlay should suppress SVG focus-agent rendering in favor of WebGL'
  );
}

main();
console.log('validate_heatmap_playback_metadata_and_focus_overlay: ok');
