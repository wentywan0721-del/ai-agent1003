const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /\.agent-settings-screen__grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*0\.96fr\)\s*minmax\(0,\s*2\.04fr\)/.test(css),
  'Expected Section 02 to switch to a left-radar plus merged-right-panel layout'
);

assert(
  /\.settings-agent-preview/.test(css)
  && /\.settings-agent-preview__figure/.test(css)
  && /\.settings-agent-preview__cards/.test(css),
  'Expected styles for the agent preview panel, figure stage, and card column'
);

assert(
  /\.settings-agent-preview__connector-line[\s\S]*stroke-dasharray/.test(css),
  'Expected dashed white connector styling for figure-to-card mapping'
);

assert(
  /\.settings-agent-preview__glow/.test(css)
  && /\.settings-agent-preview__card\.is-active/.test(css),
  'Expected glow region and active-card styling in the new preview panel'
);

console.log('validate_agent_visual_preview_styles: ok');
