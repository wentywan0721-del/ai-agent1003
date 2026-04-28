const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /visualizationDetailHoverPointer:\s*null/.test(appJs),
  'Expected Section04 state to retain the last detail-overlay pointer position for live hover tracking'
);

assert(
  /function syncVisualizationDetailHoverTargetFromPointer\(\) \{[\s\S]*findVisualizationDetailHoverTarget\(/.test(appJs),
  'Expected a helper that recomputes the detail hover target from the stored pointer position during playback'
);

assert(
  /function renderPlaybackFrame\(\) \{[\s\S]*syncVisualizationDetailHoverTargetFromPointer\(\);/.test(appJs),
  'Expected playback-frame rendering to refresh Section04 hover targets while the scene is moving'
);

console.log('validate_section04_live_hover_sync: ok');
