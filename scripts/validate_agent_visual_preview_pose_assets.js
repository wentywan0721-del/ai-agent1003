const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /const AGENT_PREVIEW_POSE_SOURCES = Object\.freeze\(\{/.test(appJs),
  'Expected app.js to define direct per-score pose image sources'
);

assert(
  /1:\s*'\.\/assets\/agent-poses\/score-1-sheet\.png'/.test(appJs)
  && /2:\s*'\.\/assets\/agent-poses\/score-2-sheet\.png'/.test(appJs)
  && /3:\s*'\.\/assets\/agent-poses\/score-3-sheet\.png'/.test(appJs)
  && /4:\s*'\.\/assets\/agent-poses\/score-4-sheet\.png'/.test(appJs)
  && /5:\s*'\.\/assets\/agent-poses\/score-5-sheet\.png'/.test(appJs),
  'Expected app.js to use the five supplied agent pose PNG files directly'
);

assert(
  /1:\s*'#ea0027'/.test(appJs)
  && /2:\s*'#ea8100'/.test(appJs)
  && /3:\s*'#eadb00'/.test(appJs)
  && /4:\s*'#00cfea'/.test(appJs)
  && /5:\s*'#0062ea'/.test(appJs),
  'Expected the preview score colors to match the supplied color reference image'
);

console.log('validate_agent_visual_preview_pose_assets: ok');
