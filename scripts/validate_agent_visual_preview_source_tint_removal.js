const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function drawAgentPreviewNeutralBase\(/.test(appJs),
  'Expected app.js to define a neutral-base extraction step for the transparent pose sources'
);

assert(
  /const brightness = \(data\[index\] \+ data\[index \+ 1\] \+ data\[index \+ 2\]\) \/ 3;[\s\S]*const chroma = Math\.max\(data\[index\], data\[index \+ 1\], data\[index \+ 2\]\) - Math\.min\(data\[index\], data\[index \+ 1\], data\[index \+ 2\]\);[\s\S]*if \(chroma >= 28 && brightness > 12\) \{[\s\S]*data\[index \+ 3\] = 0;/.test(appJs),
  'Expected the neutral-base step to remove chromatic fill pixels while keeping the grayscale line art'
);

console.log('validate_agent_visual_preview_source_tint_removal: ok');
