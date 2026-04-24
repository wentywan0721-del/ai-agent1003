const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /const bgRadius = 0\.2;/.test(appJs),
  'Expected SVG fallback background agents to use a 0.2m radius so the visible diameter is 0.4m'
);

assert(
  /function getBackgroundCrowdRenderStyle[\s\S]*personDiameterMeters = 0\.4[\s\S]*fill: '#000000'/.test(appJs),
  'Expected canvas-rendered background agents to keep the 0.4m diameter and use pure black fill'
);

assert(
  /\.visualization-stage-background\s*\{[\s\S]*z-index:\s*4;/.test(stylesCss)
  && /\.visualization-stage-heat\s*\{[\s\S]*z-index:\s*3;/.test(stylesCss)
  && /\.visualization-stage-overlay\s*\{[\s\S]*z-index:\s*5;/.test(stylesCss),
  'Expected background crowd layer to render above the heatmap and below the interactive overlay in Section 03/04'
);

assert(
  /const focusRingRadius = focusRadius \+ worldRadiusForPixels\(3\.6,\s*transform\);/.test(appJs)
  && /const focusRingStrokeWidth = worldRadiusForPixels\(1\.1,\s*transform\);/.test(appJs)
  && /class="agent-dot focus-ring\$\{pausedClass\}"[\s\S]*stroke-width="\$\{focusRingStrokeWidth\.toFixed\(3\)\}"/.test(appJs),
  'Expected the focus agent marker to use a thin outer ring with a visible gap from the center dot'
);

console.log('validate_agent_visual_layers: ok');
