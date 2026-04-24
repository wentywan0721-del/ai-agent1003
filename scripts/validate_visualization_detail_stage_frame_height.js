const assert = require('assert');
const fs = require('fs');
const path = require('path');

const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

assert(
  /\.visualization-detail__stage-frame\s*\{[\s\S]*min-height:\s*clamp\(/.test(stylesCss),
  'Expected the Section 04 stage frame to define an explicit clamp-based min-height so the map viewport does not collapse'
);

console.log('validate_visualization_detail_stage_frame_height: ok');
