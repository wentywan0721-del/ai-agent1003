const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  appJs.includes('previewPoseCacheKey:') && appJs.includes('previewPoseDataUrl:'),
  'Expected agent preview state to retain the last resolved pose image while a new pose is still composing'
);

assert(
  appJs.includes('function getSettingsAgentPreviewFigureImageUrl(dimensionScores) {'),
  'Expected a dedicated helper that resolves the current-or-last agent preview image url for Section 02'
);

assert(
  !appJs.includes('settings-agent-preview__figure-outline'),
  'Expected Section 02 figure rendering to stop falling back to the dashed outline placeholder'
);

console.log('validate_agent_visual_preview_pending_state: ok');
