const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  /id="settings-agent-visual-panel"/.test(html),
  'Expected Section 02 to expose a merged agent visual panel container'
);

assert(
  /id="settings-agent-figure-stage"/.test(html),
  'Expected Section 02 to expose a dedicated figure stage container'
);

assert(
  /id="settings-agent-connector-layer"/.test(html),
  'Expected Section 02 to expose a connector overlay container'
);

assert(
  /id="settings-dimension-list"[\s\S]*settings-agent-preview__cards/.test(html),
  'Expected the dimension description list to live inside the merged agent preview panel'
);

console.log('validate_agent_visual_preview_layout: ok');
