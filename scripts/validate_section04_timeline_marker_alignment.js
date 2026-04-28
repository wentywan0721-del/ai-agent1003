const assert = require('assert');
const fs = require('fs');
const path = require('path');

const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

const markerBlockMatch = css.match(/\.visualization-detail__timeline-marker\s*\{[\s\S]*?\n\}/);
assert(markerBlockMatch, 'Expected timeline marker style block to exist');
assert(
  /margin-top:\s*5px;/.test(markerBlockMatch[0]),
  'Expected timeline marker to be lowered so its center aligns with the first text line'
);

const lineBlockMatch = css.match(/\.visualization-detail__timeline::before\s*\{[\s\S]*?\n\}/);
assert(lineBlockMatch, 'Expected timeline connector line style block to exist');
assert(
  /top:\s*9px;/.test(lineBlockMatch[0]) && /bottom:\s*9px;/.test(lineBlockMatch[0]),
  'Expected timeline connector line to start and end at the shifted marker centers'
);
assert(
  /left:\s*4px;/.test(lineBlockMatch[0]),
  'Expected timeline connector line to remain horizontally centered on the 9px marker'
);

console.log('validate_section04_timeline_marker_alignment: ok');
