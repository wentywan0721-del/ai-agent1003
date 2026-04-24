const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const AGENT_PREVIEW_POSE_SOURCE_SEARCH_BOXES = Object\.freeze\(/.test(appJs),
  'Expected sheet-based pose search boxes for the new multi-pose preview assets'
);

assert(
  /const AGENT_PREVIEW_POSE_CROP_FRAMES = Object\.freeze\(/.test(appJs),
  'Expected explicit crop frames for the five poses in the new preview sheet'
);

assert(
  /regionMasks:\s*Object\.freeze\(/.test(appJs),
  'Expected per-pose body-part region masks for compositing the colored sheets'
);

console.log('validate_agent_visual_preview_sheet_layout: ok');
