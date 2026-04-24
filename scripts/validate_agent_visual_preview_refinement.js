const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /\.agent-settings-screen__grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*0\.96fr\)\s*minmax\(0,\s*2\.04fr\)/.test(css),
  'Expected Section 02 to widen the left radar panel and slightly narrow the right preview panel'
);

assert(
  /\.settings-agent-preview__figure\s*\{[\s\S]*background:\s*transparent;/.test(css),
  'Expected the figure-side inner container to become visually transparent'
);

assert(
  /\.settings-agent-preview::before\s*\{[\s\S]*content:\s*none;/.test(css),
  'Expected the extra inner frame inside the merged preview panel to be removed'
);

assert(
  /\.settings-agent-preview__cards\s*\{[\s\S]*gap:\s*18px;/.test(css),
  'Expected the five description cards to use larger vertical spacing'
);

assert(
  /function drawAgentPreviewNeutralBase\(/.test(appJs)
  && /function computeAgentPreviewOpaqueBounds\(/.test(appJs)
  && !/function transformAgentPreviewLineArt\(/.test(appJs),
  'Expected app.js to refine the preview through transparent-pose cropping and neutral-base compositing instead of white-line-art rewriting'
);

console.log('validate_agent_visual_preview_refinement: ok');
