const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const AGENT_PREVIEW_REFERENCE_DISPLAY_SCORE = 4;/.test(appJs),
  'Expected Section 02 preview scaling to normalize every pose against the score-4 figure'
);

assert(
  /function extractAgentPreviewChromaticComponents\(/.test(appJs)
  && /function buildAgentPreviewRegionMaskCanvas\(/.test(appJs),
  'Expected Section 02 to extract exact colored body regions from the reference pose sheets before compositing'
);

assert(
  !/<ellipse class="settings-agent-preview__glow"/.test(appJs)
  && !/<ellipse class="settings-agent-preview__glow-core"/.test(appJs),
  'Expected Section 02 figure rendering to stop drawing circular glow spots over body regions'
);

console.log('validate_section02_exact_preview_composition: ok');
