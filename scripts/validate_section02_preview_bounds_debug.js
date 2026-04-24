const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /function computeAgentPreviewDisplayedOpaqueBounds\(/.test(appJs),
  'Expected Section 02 preview to keep the scaled opaque-bounds calculation available for figure layout'
);

assert(
  !/<rect class="settings-agent-preview__bounds-debug"/.test(appJs),
  'Expected Section 02 figure markup to stop rendering the outer debug frame around the elderly preview'
);

assert(
  /displayedOpaqueBounds,/.test(appJs),
  'Expected the opaque-bounds values to remain available for figure sizing even after removing the visible frame'
);

assert(
  /const AGENT_PREVIEW_DISPLAY_SHIFT_BY_SCORE = Object\.freeze\(\{[\s\S]*1:\s*Object\.freeze\(\{\s*x:\s*0,\s*y:\s*0\s*\}\),[\s\S]*2:\s*Object\.freeze\(\{\s*x:\s*0,\s*y:\s*0\s*\}\),[\s\S]*3:\s*Object\.freeze\(\{\s*x:\s*0,\s*y:\s*0\s*\}\),[\s\S]*4:\s*Object\.freeze\(\{\s*x:\s*0,\s*y:\s*0\s*\}\),[\s\S]*5:\s*Object\.freeze\(\{\s*x:\s*0,\s*y:\s*0\s*\}\),[\s\S]*\}\);/.test(appJs),
  'Expected all pose-specific display shifts to be removed so every figure aligns by the same bounds center'
);

assert(
  /const AGENT_PREVIEW_CONNECTOR_END_SHIFT_PX = 0;/.test(appJs)
  && /const endX = cardRect\.left - connectorLayerRect\.left \+ AGENT_PREVIEW_CONNECTOR_END_SHIFT_PX;/.test(appJs),
  'Expected Section 02 connectors to end exactly at the card edge via the shared end-shift constant'
);

assert(
  /const AGENT_PREVIEW_CONNECTOR_START_SHIFT_BY_SCORE_AND_DIMENSION = Object\.freeze\(\{[\s\S]*3:\s*Object\.freeze\(\{\s*locomotor:\s*\d+,\s*\}\),[\s\S]*4:\s*Object\.freeze\(\{\s*locomotor:\s*\d+,\s*\}\),[\s\S]*5:\s*Object\.freeze\(\{\s*locomotor:\s*\d+,\s*\}\),[\s\S]*\}\);/.test(appJs)
  && /const scoreStartShift = AGENT_PREVIEW_CONNECTOR_START_SHIFT_BY_SCORE_AND_DIMENSION\[previewData\.score\] \|\| \{\};/.test(appJs)
  && /const startOffsetX = Number\(scoreStartShift\[dimensionId\] \|\| 0\);/.test(appJs),
  'Expected only the locomotor connector for scores 3, 4, and 5 to receive a small extra rightward start shift'
);

console.log('validate_section02_preview_bounds_debug: ok');
