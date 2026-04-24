const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const AGENT_PREVIEW_DISPLAY_SCALE_BY_SCORE = Object\.freeze\(\{[\s\S]*1:\s*0\.48,[\s\S]*2:\s*0\.86,[\s\S]*3:\s*0\.98,[\s\S]*4:\s*1\.02,[\s\S]*5:\s*1\.06,[\s\S]*\}\);/.test(appJs),
  'Expected Section 02 pose scale tuning to further shrink the score-1 wheelchair pose while keeping the other current scales'
);

console.log('validate_section02_preview_pose_scale_tuning: ok');
