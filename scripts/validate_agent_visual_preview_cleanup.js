const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
const regionBlockMatch = css.match(/\.settings-agent-preview__region\s*\{[\s\S]*?\}/);

assert(
  /const AGENT_PREVIEW_POSE_SOURCES = Object\.freeze\(\{/.test(appJs),
  'Expected the preview to use direct per-score pose PNG files instead of the old sprite cleanup path'
);

assert(
  /function trimAgentPreviewCanvasToBounds\(/.test(appJs)
  && /trimAgentPreviewCanvasToBounds\(canvas/.test(appJs),
  'Expected the pose renderer to trim transparent margins after converting the white background to transparency'
);

assert(
  /function getAgentPreviewRegionMarkup\(/.test(appJs)
  && /settings-agent-preview__region/.test(appJs),
  'Expected the preview to render solid region tint layers instead of oversized glow blobs'
);

assert(
  Boolean(regionBlockMatch)
  && !/blur\(/.test(regionBlockMatch[0]),
  'Expected region tint styling without blur-based glow'
);

console.log('validate_agent_visual_preview_cleanup: ok');
