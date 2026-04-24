const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');

assert(
  /function getAgentRadarTextPlacement\(id,\s*locale = state\.locale\)/.test(appJs),
  'Expected radar text placement to be driven by a dedicated per-dimension helper'
);

assert(
  /sensory:\s*\{[\s\S]*labelY:\s*-\d+/.test(appJs),
  'Expected the sensory label stack to be lifted upward'
);

assert(
  /sensory:\s*\{[\s\S]*x:\s*0/.test(appJs),
  'Expected the sensory label stack to stay on its axis without lateral drift'
);

assert(
  /vitality:\s*\{[\s\S]*labelY:\s*-\d+/.test(appJs),
  'Expected the vitality label stack to be lifted upward'
);

assert(
  /vitality:\s*\{[\s\S]*x:\s*0/.test(appJs),
  'Expected the vitality label stack to stay on its axis without lateral drift'
);

assert(
  /psychological:\s*\{[\s\S]*x:\s*isEnglish\s*\?\s*-\d+\s*:\s*-\d+/.test(appJs),
  'Expected the psychological label stack to shift left'
);

assert(
  /cognitive:\s*\{[\s\S]*x:\s*isEnglish\s*\?\s*\d+\s*:\s*\d+/.test(appJs),
  'Expected the cognitive label stack to shift right'
);

assert(
  /lineEndPoint:/.test(appJs)
  && /x2="\$\{lineEndPoint\.x\.toFixed\(2\)\}" y2="\$\{lineEndPoint\.y\.toFixed\(2\)\}"/.test(appJs),
  'Expected radar axis lines to stop at the score position rather than the outer label text'
);

assert(
  /<text class="agent-radar-label"[\s\S]*text-anchor="middle"[\s\S]*<\/text>[\s\S]*<text class="agent-radar-score"[\s\S]*text-anchor="middle"/.test(appJs),
  'Expected radar labels and scores to share centered text alignment'
);

console.log('validate_radar_text_alignment: ok');
